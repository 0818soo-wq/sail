// SAIL 트레이너 - ESP32-S3-Touch-LCD-1.54 표시기
//
// 하는 일: 서버의 현재 문장을 가져와 화면에 크게 띄우고,
//          보드의 버튼 두 개로 폰 앱의 [듣기] / [다음]을 누른다.
//
// 필요한 라이브러리 (Arduino IDE > 라이브러리 매니저에서 설치):
//   - GFX Library for Arduino  (moononournation)
//   - ArduinoJson              (Benoit Blanchon)
//   - U8g2                     (oliver)   <- 글꼴용
//
// 보드 설정 (Arduino IDE > 도구):
//   보드      : ESP32S3 Dev Module
//   PSRAM     : OPI PSRAM
//   Flash Size: 16MB (128Mb)
//   USB CDC On Boot: Enabled     <- 이걸 켜야 시리얼 모니터가 보인다

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <U8g2lib.h>
#include <Arduino_GFX_Library.h>

// ===================== 여기만 고치면 됩니다 =====================

// 1) 집 와이파이 (2.4GHz만 됩니다. 5GHz는 이 보드가 못 잡습니다)
const char *WIFI_SSID = "와이파이이름";
const char *WIFI_PASS = "와이파이비밀번호";

// 2) 서버 주소 (https:// 빼고 도메인만)
const char *SERVER_HOST = "opic-trainer-tw9g.onrender.com";

// 3) 화면 핀 - ESP32-S3-Touch-LCD-1.54 핀 표 기준이라 그대로 두면 됩니다
#define LCD_SCK 38   // LCD_CLK
#define LCD_MOSI 39  // LCD_DIN
#define LCD_DC 45    // LCD_DC
#define LCD_CS 21    // LCD_CS
#define LCD_RST 40   // LCD_RST
#define LCD_BL 46    // LCD_BL (백라이트)

// 4) 버튼 - 보드 윗면의 "-KEY"(IO0)와 "PLUS"(IO4)
#define BTN_NEXT 0    // 다음 문장
#define BTN_LISTEN 4  // 새 질문 듣기

// 5) 화면 방향 0~3. 글자가 뒤집혀 보이면 숫자를 바꿔보세요
#define LCD_ROTATION 0

// 6) 화면 밝기 0(꺼짐)~255(최대). 낮출수록 눈이 편하고 배터리가 오래 갑니다
#define BL_BRIGHTNESS 60

// ==============================================================

Arduino_DataBus *bus = new Arduino_ESP32SPI(LCD_DC, LCD_CS, LCD_SCK, LCD_MOSI, GFX_NOT_DEFINED);
Arduino_GFX *gfx = new Arduino_ST7789(bus, LCD_RST, LCD_ROTATION, true /* IPS */, 240, 240);

// 라이브러리 버전에 따라 BLACK/WHITE 이름이 다르므로 색을 직접 숫자로 정의한다 (RGB565 형식)
const uint16_t COLOR_BG = 0x0000;     // 검정
const uint16_t COLOR_TEXT = 0xFFFF;   // 흰색
const uint16_t COLOR_TITLE = 0x8C7F;  // 연보라

WiFiClientSecure secureClient;
HTTPClient http;

String lastDrawn;       // 같은 내용을 다시 그리지 않기 위해
uint32_t lastPoll = 0;  // 마지막으로 서버를 확인한 시각
const uint32_t POLL_MS = 600;

// 화면 글꼴이 ASCII만 지원하므로, 앱이 보내는 한글 상태 문구는 영어로 바꿔 보여준다
struct Phrase {
  const char *ko;
  const char *en;
};
const Phrase PHRASES[] = {
  {"질문 듣는 중", "LISTENING..."},
  {"답변 만드는 중", "THINKING..."},
  {"답변 끝", "DONE"},
};

// 화면 글꼴은 ASCII만 지원한다. 따옴표(' ')나 줄표(— –) 같은 문자는 비슷한 ASCII로 낮추고,
// 그 밖의 비ASCII 문자(한글, 이모지)는 버린다.
String toAscii(const String &in) {
  String out;
  out.reserve(in.length());
  for (size_t i = 0; i < in.length();) {
    uint8_t c = (uint8_t)in[i];
    if (c < 0x80) {
      out += (char)c;
      i++;
      continue;
    }
    size_t len = (c >= 0xF0) ? 4 : (c >= 0xE0) ? 3 : 2;
    // U+2013..U+2026 구간의 문장부호는 E2 80 xx 로 시작한다
    if (len == 3 && c == 0xE2 && (uint8_t)in[i + 1] == 0x80) {
      switch ((uint8_t)in[i + 2]) {
        case 0x93:  // –
        case 0x94:  // —
          out += '-';
          break;
        case 0x98:  // '
        case 0x99:  // '
          out += '\'';
          break;
        case 0x9C:  // "
        case 0x9D:  // "
          out += '"';
          break;
        case 0xA6:  // …
          out += "...";
          break;
      }
    }
    i += len;
  }
  out.trim();
  return out;
}

String forDisplay(const String &raw) {
  for (const Phrase &p : PHRASES) {
    if (raw.indexOf(p.ko) >= 0) return String(p.en);
  }
  return toAscii(raw);
}

// 읽기 편한 굵은 글꼴 (U8g2의 Helvetica Bold). 큰 것부터 차례로 써 보고, 화면에 다 들어가는 가장 큰 글꼴을 고른다
struct FontSpec {
  const uint8_t *font;
  int16_t lineH;    // 줄 간격(px)
  int16_t ascent;   // 줄 맨 위에서 글자 바닥선까지(px)
};
const FontSpec FONTS[] = {
  {u8g2_font_helvB24_tr, 30, 24},
  {u8g2_font_helvB18_tr, 23, 18},
  {u8g2_font_helvB14_tr, 18, 14},
  {u8g2_font_helvB12_tr, 16, 12},
};
const int FONT_COUNT = sizeof(FONTS) / sizeof(FONTS[0]);
// 글꼴 크기를 일정하게: 0=가장 큼(24), 1=18, 2=14, 3=12. 문장이 화면에 안 들어갈 때만 자동으로 더 작아진다
const int START_FONT = 1;
const int16_t TEXT_LEFT = 6;
const int16_t TEXT_WIDTH = 240 - 12;  // 좌우 여백 6px씩

uint16_t textWidthPx(const String &s) {
  int16_t x1, y1;
  uint16_t w, h;
  gfx->getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  return w;
}

// 현재 설정된 글꼴로 단어 단위 줄바꿈. lines가 NULL이 아니면 줄 내용도 채운다. 반환값: 줄 수
int wrapLines(const String &text, String *lines, int maxLines) {
  int count = 0;
  String cur;
  int i = 0, n = text.length();
  while (i < n) {
    int sp = text.indexOf(' ', i);
    if (sp < 0) sp = n;
    String word = text.substring(i, sp);
    i = sp + 1;
    if (word.length() == 0) continue;
    String trial = cur.length() ? cur + " " + word : word;
    if (cur.length() && textWidthPx(trial) > TEXT_WIDTH) {
      if (lines && count < maxLines) lines[count] = cur;
      count++;
      cur = word;
    } else {
      cur = trial;
    }
  }
  if (cur.length()) {
    if (lines && count < maxLines) lines[count] = cur;
    count++;
  }
  return count;
}

void drawWrapped(const String &text, int16_t top) {
  gfx->setTextWrap(false);  // 줄바꿈은 우리가 직접 한다 (글자 폭 측정이 틀어지지 않게)
  const int16_t avail = 240 - top - 2;
  int pick = FONT_COUNT - 1;
  for (int f = START_FONT; f < FONT_COUNT; f++) {
    gfx->setFont(FONTS[f].font);
    if (wrapLines(text, NULL, 0) * FONTS[f].lineH <= avail) {
      pick = f;
      break;
    }
  }
  const FontSpec &fs = FONTS[pick];
  gfx->setFont(fs.font);

  const int MAX_LINES = 14;
  String lines[MAX_LINES];
  int count = wrapLines(text, lines, MAX_LINES);
  if (count > MAX_LINES) count = MAX_LINES;
  for (int i = 0; i < count; i++) {
    int16_t baseline = top + fs.ascent + i * fs.lineH;
    if (baseline > 240) break;
    gfx->setCursor(TEXT_LEFT, baseline);
    gfx->print(lines[i]);
  }
}

void render(const String &title, const String &text) {
  gfx->fillScreen(COLOR_BG);

  gfx->setFont();  // 제목은 기본 작은 글꼴로
  gfx->setTextSize(1);
  int16_t top = 4;
  if (title.length()) {
    gfx->setTextColor(COLOR_TITLE);
    gfx->setCursor(4, 4);
    gfx->print(toAscii(title));
    top = 18;
  }

  gfx->setTextColor(COLOR_TEXT);
  drawWrapped(text, top);
}

void sendCommand(const char *cmd) {
  String url = String("https://") + SERVER_HOST + "/api/control";
  if (!http.begin(secureClient, url)) return;
  http.addHeader("Content-Type", "application/json");
  http.POST(String("{\"cmd\":\"") + cmd + "\"}");
  http.end();
}

void poll() {
  String url = String("https://") + SERVER_HOST + "/api/current";
  if (!http.begin(secureClient, url)) return;

  int code = http.GET();
  if (code == 200) {
    JsonDocument doc;
    if (!deserializeJson(doc, http.getString())) {
      String title = doc["title"].as<String>();
      String text = forDisplay(doc["text"].as<String>());
      String key = title + "\n" + text;
      if (key != lastDrawn) {  // 바뀔 때만 다시 그린다 (깜빡임 방지)
        lastDrawn = key;
        render(title, text);
      }
    }
  }
  http.end();
}

// 눌렀다 떼는 순간 한 번만 반응하게
bool pressed(uint8_t pin, bool &wasDown) {
  bool down = digitalRead(pin) == LOW;
  bool fired = down && !wasDown;
  wasDown = down;
  return fired;
}

const uint16_t COLOR_RED = 0xF800;
const uint16_t COLOR_GREEN = 0x07E0;
const uint16_t COLOR_YELLOW = 0xFFE0;

// ---- 진단용: 화면에 작은 글씨로 여러 줄을 찍는다 ----
int16_t diagY = 4;

void diagClear() {
  gfx->fillScreen(COLOR_BG);
  diagY = 4;
}

void diagLine(const String &s, uint16_t color = COLOR_TEXT) {
  Serial.println(s);
  if (diagY > 228) return;
  gfx->setTextSize(1);
  gfx->setTextColor(color);
  gfx->setCursor(4, diagY);
  gfx->print(s);
  diagY += 11;
}

// 주변 와이파이를 찾아 화면에 보여주고, 내 와이파이 이름이 보이는지 돌려준다
bool scanAndShow() {
  diagLine("Scanning...", COLOR_TITLE);
  int n = WiFi.scanNetworks(false, true);
  bool seen = false;
  diagLine(String(n) + " networks found", COLOR_TITLE);
  int shown = 0;
  for (int i = 0; i < n && shown < 9; i++) {
    String ssid = WiFi.SSID(i);
    bool exact = (ssid == WIFI_SSID);
    if (exact) seen = true;
    String shownName = toAscii(ssid);
    String line = String(exact ? ">" : " ") + shownName + " ch" + String((int)WiFi.channel(i)) + " " + String((int)WiFi.RSSI(i));
    if (shownName != ssid) line += " (non-ascii)";
    diagLine(line, exact ? COLOR_GREEN : COLOR_TEXT);
    shown++;
  }
  WiFi.scanDelete();
  return seen;
}

// 와이파이에 붙을 때까지 계속 시도한다. 실패하면 이유를 화면에 보여준다
void connectWifi() {
  WiFi.mode(WIFI_STA);
  for (int attempt = 1;; attempt++) {
    diagClear();
    diagLine("WiFi try #" + String(attempt), COLOR_TITLE);
    diagLine(String("Name: ") + WIFI_SSID, COLOR_YELLOW);
    bool seen = scanAndShow();
    if (!seen) diagLine("!! Name NOT seen. 2.4GHz on?", COLOR_RED);

    WiFi.disconnect(true, true);
    delay(200);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    uint32_t t0 = millis();
    wl_status_t s = WiFi.status();
    while (millis() - t0 < 20000) {
      s = WiFi.status();
      if (s == WL_CONNECTED || s == WL_CONNECT_FAILED) break;
      delay(300);
    }
    if (s == WL_CONNECTED) return;

    if (s == WL_NO_SSID_AVAIL) diagLine("FAIL: name not found", COLOR_RED);
    else if (s == WL_CONNECT_FAILED) diagLine("FAIL: password/security", COLOR_RED);
    else diagLine("FAIL: timeout, status=" + String((int)s), COLOR_RED);
    diagLine("Retry in 5s...", COLOR_TITLE);
    delay(5000);
  }
}

void setup() {
  Serial.begin(115200);

  ledcAttach(LCD_BL, 5000, 8);  // 백라이트를 PWM으로 켜서 밝기를 조절한다
  ledcWrite(LCD_BL, BL_BRIGHTNESS);
  pinMode(BTN_NEXT, INPUT_PULLUP);
  pinMode(BTN_LISTEN, INPUT_PULLUP);

  gfx->begin();
  diagClear();

  connectWifi();
  diagClear();
  diagLine("WiFi OK", COLOR_GREEN);
  diagLine(WiFi.localIP().toString());
  delay(1200);

  secureClient.setInsecure();  // 서버 인증서 검증 생략 (개인용)
  http.setReuse(true);         // 연결을 유지해 응답을 빠르게

  render("", "READY");
}

void loop() {
  static bool nextWasDown = false, listenWasDown = false;

  if (pressed(BTN_NEXT, nextWasDown)) {
    sendCommand("next");
    delay(150);
  }
  if (pressed(BTN_LISTEN, listenWasDown)) {
    sendCommand("listen");
    delay(150);
  }

  if (millis() - lastPoll >= POLL_MS) {
    lastPoll = millis();
    if (WiFi.status() == WL_CONNECTED) poll();
    else WiFi.reconnect();
  }

  delay(20);
}

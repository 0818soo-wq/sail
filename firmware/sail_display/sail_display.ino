// SAIL 트레이너 - ESP32-S3-Touch-LCD-1.54 표시기
//
// 하는 일: 서버의 현재 문장을 가져와 화면에 크게 띄우고,
//          보드의 버튼 두 개로 폰 앱의 [듣기] / [다음]을 누른다.
//
// 필요한 라이브러리 (Arduino IDE > 라이브러리 매니저에서 설치):
//   - GFX Library for Arduino  (moononournation)
//   - ArduinoJson              (Benoit Blanchon)
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

// 단어 단위로 줄을 나눠 그린다
void drawWrapped(const String &text, uint8_t size, int16_t top) {
  gfx->setTextSize(size);
  const int16_t charW = 6 * size;
  const int16_t lineH = 8 * size + 4;
  const int16_t maxChars = (240 - 8) / charW;

  int16_t y = top;
  int start = 0;
  while (start < (int)text.length() && y < 240 - lineH) {
    int end = start + maxChars;
    if (end >= (int)text.length()) {
      end = text.length();
    } else {
      int space = text.lastIndexOf(' ', end);  // 단어 중간에서 자르지 않기
      if (space > start) end = space;
    }
    gfx->setCursor(4, y);
    gfx->print(text.substring(start, end));
    y += lineH;
    start = end;
    while (start < (int)text.length() && text[start] == ' ') start++;
  }
}

void render(const String &title, const String &text) {
  gfx->fillScreen(COLOR_BG);

  if (title.length()) {
    gfx->setTextSize(1);
    gfx->setTextColor(COLOR_TITLE);
    gfx->setCursor(4, 4);
    gfx->print(toAscii(title));
  }

  gfx->setTextColor(COLOR_TEXT);
  uint8_t size = text.length() <= 36 ? 3 : 2;  // 짧은 문장은 크게
  drawWrapped(text, size, 22);
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

void setup() {
  Serial.begin(115200);

  pinMode(LCD_BL, OUTPUT);
  digitalWrite(LCD_BL, HIGH);
  pinMode(BTN_NEXT, INPUT_PULLUP);
  pinMode(BTN_LISTEN, INPUT_PULLUP);

  gfx->begin();
  gfx->fillScreen(COLOR_BG);
  gfx->setTextColor(COLOR_TITLE);
  gfx->setTextSize(2);
  gfx->setCursor(4, 100);
  gfx->print("WiFi...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK: " + WiFi.localIP().toString());

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

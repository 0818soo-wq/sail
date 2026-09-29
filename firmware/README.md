# ESP32-S3 표시기 올리는 법

`sail_display.ino`를 보드에 구우면, 현재 문장이 1.54인치 화면에 뜨고 보드 버튼으로
폰 앱의 [듣기] / [다음]을 누를 수 있습니다.

보드: **ESP32-S3-Touch-LCD-1.54** (스팟피어/Waveshare, ESP32-S3R8, 16MB 플래시, 8MB PSRAM)

## 1. Arduino IDE 설치

<https://www.arduino.cc/en/software> 에서 Arduino IDE 2.x를 받아 설치합니다.

## 2. ESP32 보드 패키지 추가

1. **File > Preferences** (맥: Arduino IDE > Settings)
2. *Additional board manager URLs* 칸에 붙여넣기:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
3. **Tools > Board > Boards Manager** 에서 `esp32` 검색 → **esp32 by Espressif Systems** 설치
   (용량이 커서 5~10분 걸립니다)

## 3. 라이브러리 2개 설치

**Tools > Manage Libraries** 에서 각각 검색해 설치합니다.

| 검색어 | 설치할 것 |
| --- | --- |
| `GFX Library for Arduino` | GFX Library for Arduino (moononournation) |
| `ArduinoJson` | ArduinoJson (Benoit Blanchon) — 버전 7 |

## 4. 보드 설정

USB-C 케이블로 보드를 PC에 연결하고 **Tools** 메뉴에서:

| 항목 | 값 |
| --- | --- |
| Board | ESP32S3 Dev Module |
| USB CDC On Boot | **Enabled** |
| Flash Size | 16MB (128Mb) |
| PSRAM | **OPI PSRAM** |
| Partition Scheme | 16M Flash (3MB APP/9.9MB FATFS) |
| Port | 연결된 포트 선택 |

포트가 목록에 안 보이면 다운로드 모드로 들어갑니다: **BOOT 버튼을 누른 채로**
USB를 연결하고 → BOOT에서 손을 뗀 뒤 → 포트를 다시 확인합니다.

## 5. 설정값 4개 채우기

`sail_display.ino` 맨 위의 "여기만 고치면 됩니다" 블록에서:

- `WIFI_SSID`, `WIFI_PASS` — **2.4GHz** 와이파이만 됩니다 (5GHz는 이 보드가 못 잡습니다)
- `SERVER_HOST` — 배포된 서버 주소에서 `https://` 를 뺀 것

화면 핀과 버튼 핀은 이 보드 기준으로 이미 채워져 있으니 건드리지 않아도 됩니다.

## 6. 업로드

**Sketch > Upload** (→ 버튼). "Connecting..." 에서 멈추면 BOOT 버튼을 누른 채로 다시 시도합니다.

성공하면 화면에 `WiFi...` → `READY` 순서로 뜹니다.

## 쓰는 법

- 화면에 폰 앱의 현재 문장이 그대로 뜹니다
- **PLUS 버튼(IO4)** = 듣기 (새 질문 녹음 시작)
- **-KEY / BOOT 버튼(IO0)** = 다음 문장
- 폰 앱은 켜둔 채로 둬야 합니다 (녹음과 생성은 폰이 합니다)

## 잘 안 될 때

| 증상 | 확인할 것 |
| --- | --- |
| 화면이 계속 까맣다 | 백라이트 핀(46)과 업로드 성공 여부. Arduino_GFX 예제 `04_gfx_helloworld`를 먼저 돌려 화면부터 확인 |
| 화면이 켜지는데 글자가 밀려 있다 | `Arduino_ST7789(...)` 끝에 오프셋을 추가: `..., 240, 240, 0, 20, 0, 0` 처럼 숫자를 조정 |
| 글자가 뒤집혀 보인다 | `LCD_ROTATION` 을 0→1→2→3 으로 바꿔보기 |
| `WiFi...` 에서 멈춘다 | 5GHz 와이파이가 아닌지, SSID/비밀번호 오타 확인 |
| 화면은 켜지는데 문장이 안 바뀐다 | `SERVER_HOST` 오타, 폰 앱이 켜져 있는지 확인 |
| 한글 상태 문구가 깨진다 | 정상입니다 — 기본 글꼴이 영문뿐이라 `LISTENING...` 등 영어로 바꿔서 표시합니다 |

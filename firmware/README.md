# ESP32-S3 표시기 만들기 (윈도우 기준, 처음 하는 사람용)

보드에 프로그램을 한 번 구워두면, 폰 앱의 현재 문장이 1.54인치 화면에 뜨고
보드 버튼으로 [듣기] / [다음]을 누를 수 있습니다.

보드 이름: **ESP32-S3-Touch-LCD-1.54**

준비물: 보드, **데이터 전송이 되는** USB-C 케이블(충전 전용 케이블은 안 됩니다), 윈도우 PC

전체 40분쯤 걸리고, 대부분은 설치를 기다리는 시간입니다.

---

## 1단계. Arduino IDE 설치 (10분)

프로그램을 보드에 구워주는 도구입니다.

1. 브라우저로 <https://www.arduino.cc/en/software> 접속
2. 스크롤을 내려 **Downloads** 표를 찾습니다
3. **Windows** 줄의 **"Win 10 and newer, 64 bits"** 를 클릭
4. "Support the Arduino IDE" 라는 후원 안내 화면이 뜹니다 → 왼쪽 **JUST DOWNLOAD** 클릭
5. 이메일을 묻는 화면이 또 나오면 → 아래쪽 **JUST DOWNLOAD** 를 한 번 더 클릭
6. 다운로드된 파일(`arduino-ide_2.x.x_Windows_64bit.exe`)을 더블클릭
7. 설치 창이 뜨면 계속 **동의 / 다음 / 설치** 를 누릅니다
8. 중간에 파란 창으로 **"이 앱이 디바이스를 변경할 수 있도록 허용"** 이 뜨면 **예**
9. 설치가 끝나면 Arduino IDE가 자동으로 실행됩니다
10. 처음 실행하면 **Windows 방화벽** 경고가 뜰 수 있습니다 → **액세스 허용**

> 화면 왼쪽에 아이콘이 세로로 줄지어 있고, 가운데에 코드 편집창이 있으면 정상입니다.

---

## 2단계. ESP32 보드 패키지 설치 (10~15분, 용량이 큽니다)

Arduino IDE가 우리 보드를 알아보게 만드는 작업입니다.

1. 위쪽 메뉴에서 **File > Preferences** 클릭 (단축키 `Ctrl` + `,`)
2. 창이 뜨면 **아래쪽**에 `Additional boards manager URLs` 라는 긴 입력칸이 있습니다
3. 그 칸에 아래 주소를 복사해서 붙여넣기:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. 오른쪽 아래 **OK** 클릭
5. 화면 **왼쪽 세로 아이콘 줄**에서 **위에서 두 번째**(초록색 칩처럼 생긴 아이콘)를 클릭
   - 메뉴로 가도 됩니다: **Tools > Board > Boards Manager**
6. 검색칸에 `esp32` 입력
7. 목록에서 **esp32 by Espressif Systems** 를 찾아 **INSTALL** 클릭
8. **여기서 10분 넘게 걸립니다.** 화면 오른쪽 아래에 진행 막대가 보입니다. 그냥 기다리세요
9. 버튼이 사라지거나 `INSTALLED` 로 바뀌면 완료

---

## 3단계. 라이브러리 3개 설치 (3분)

화면에 글씨를 그리고, 서버 응답을 읽는 데 필요한 부품입니다.

1. 왼쪽 세로 아이콘 줄에서 **위에서 세 번째**(책 쌓인 모양)를 클릭
   - 메뉴: **Tools > Manage Libraries** (`Ctrl` + `Shift` + `I`)
2. 검색칸에 `GFX Library for Arduino` 입력
   → **GFX Library for Arduino** (만든이 *moononournation*) 의 **INSTALL** 클릭
   → "함께 설치할까요?" 같은 창이 뜨면 **INSTALL ALL**
3. 검색칸을 지우고 `ArduinoJson` 입력
   → **ArduinoJson** (만든이 *Benoit Blanchon*) 의 **INSTALL** 클릭
   → 버전은 건드리지 말고 기본값(7.x) 그대로
4. 검색칸을 지우고 `U8g2` 입력
   → **U8g2** (만든이 *oliver*) 의 **INSTALL** 클릭 (화면 글꼴용입니다)

---

## 4단계. 코드 가져오기 (3분)

1. Arduino IDE에서 **File > New Sketch** (`Ctrl` + `N`)
2. 새 창의 코드를 **전부 지웁니다** (편집창 안을 클릭 → `Ctrl` + `A` → `Delete`)
3. 브라우저로 아래 주소를 엽니다:
   <https://github.com/0818soo-wq/sail/blob/claude/opic-test-answer-generator-idt0e4/firmware/sail_display/sail_display.ino>
4. 코드 상자 **오른쪽 위의 복사 아이콘**(네모 두 개 겹친 모양)을 클릭하면 전체가 복사됩니다
5. Arduino IDE 편집창을 클릭하고 `Ctrl` + `V` 로 붙여넣기
6. **File > Save As** → 폴더는 아무데나, 파일 이름은 반드시 **`sail_display`**
   → 같은 이름의 폴더가 자동으로 만들어지면 정상입니다

---

## 5단계. 내 정보 3줄 고치기 (2분)

붙여넣은 코드 맨 위쪽에 `여기만 고치면 됩니다` 라고 적힌 부분이 있습니다.
**따옴표(`"`)는 지우지 말고 그 안의 글자만** 바꾸세요.

```cpp
const char *WIFI_SSID = "와이파이이름";        // 예: "KT_GiGA_2G_ABCD"
const char *WIFI_PASS = "와이파이비밀번호";     // 와이파이 비밀번호
const char *SERVER_HOST = "opic-trainer-tw9g.onrender.com";   // 이미 맞게 들어있음
```

⚠️ 와이파이는 **2.4GHz** 만 됩니다. 공유기 이름에 `5G` 가 붙은 것 말고,
`2G` 가 붙었거나 아무 표시 없는 쪽을 쓰세요. 이 보드는 5GHz를 못 잡습니다.

---

## 6단계. 보드 연결하고 설정 (3분)

1. USB-C 케이블로 보드와 PC를 연결합니다
2. 위쪽 메뉴 **Tools** 를 열고 아래처럼 맞춥니다
   (항목을 클릭하면 선택지가 옆으로 펼쳐집니다)

| Tools 메뉴 항목 | 고를 값 |
| --- | --- |
| Board > esp32 > | **ESP32S3 Dev Module** |
| USB CDC On Boot | **Enabled** |
| Flash Size | **16MB (128Mb)** |
| PSRAM | **OPI PSRAM** |
| Partition Scheme | **16M Flash (3MB APP/9.9MB FATFS)** |
| Port | **COM3** 처럼 숫자가 붙은 것 |

### Port 에 아무것도 안 보이면 (자주 있는 일입니다)

보드를 "다운로드 모드"로 넣어야 합니다:

1. USB 케이블을 뺍니다
2. 보드 윗면 **BOOT 버튼을 손가락으로 꾹 누른 채로**
3. 그 상태에서 USB 케이블을 꽂습니다
4. 2초쯤 뒤 BOOT 버튼에서 손을 뗍니다
5. **Tools > Port** 를 다시 확인 → 이제 COM 포트가 보입니다

---

## 7단계. 업로드 (2분)

1. 화면 **왼쪽 위의 오른쪽 화살표(→)** 버튼을 클릭합니다
   (그 옆 체크(✓)는 문법 검사만 하는 버튼입니다)
2. 아래쪽 검은 창에 글씨가 쭉 올라갑니다. **2분쯤 걸립니다**
3. 끝에 `Hard resetting via RTS pin...` 이 나오면 성공입니다
4. 보드 화면에 `WiFi...` 가 뜨고, 잠시 뒤 `READY` 로 바뀝니다

`Connecting......____` 에서 멈추면 → 6단계의 "다운로드 모드" 방법으로 다시 꽂고 재시도합니다.

---

## 다 됐습니다 — 쓰는 법

1. 폰에서 앱을 켭니다 (`https://opic-trainer-tw9g.onrender.com`) — **폰 앱은 켜둔 채로** 둡니다
2. 보드의 **PLUS 버튼** = 듣기 (새 질문 녹음 시작)
3. 보드의 **-KEY(BOOT) 버튼** = 다음 문장
4. 문장은 보드 화면에 자동으로 따라 뜹니다

녹음과 답변 생성은 폰이 하고, 보드는 화면과 버튼 역할만 합니다.

---

## 잘 안 될 때

| 증상 | 해결 |
| --- | --- |
| Port 에 아무것도 안 뜬다 | 6단계의 다운로드 모드. 그래도 안 되면 **충전 전용 케이블**일 수 있으니 다른 USB-C 케이블로 교체 |
| `Connecting...` 에서 멈춘다 | 다운로드 모드로 다시 연결 후 업로드 |
| 업로드는 됐는데 화면이 까맣다 | 예제 `04_gfx_helloworld` 를 먼저 올려 화면 자체를 확인 |
| 글자가 화면 밖으로 밀려 있다 | 코드에서 `Arduino_ST7789(bus, LCD_RST, LCD_ROTATION, true, 240, 240)` 를 `..., 240, 240, 0, 20, 0, 0)` 으로 바꿔보기 |
| 글자가 뒤집혀 있다 | `#define LCD_ROTATION 0` 의 숫자를 1, 2, 3 으로 바꿔가며 다시 업로드 |
| `WiFi...` 에서 안 넘어간다 | 5GHz 와이파이가 아닌지, 이름·비밀번호 오타 확인 |
| 화면은 켜지는데 문장이 안 따라온다 | 폰 앱이 켜져 있는지, `SERVER_HOST` 주소 오타 확인 |
| 한글이 깨져 보인다 | 정상입니다. 글꼴이 영문뿐이라 `LISTENING...` 처럼 영어로 바꿔 띄웁니다 |
| `u8g2_font_... was not declared` 오류 | 3단계의 **U8g2** 라이브러리를 설치했는지 확인 |

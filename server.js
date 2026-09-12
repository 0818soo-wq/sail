// 오픽 원버튼 트레이너 - 알림 발송 서버
// 정적 파일(프론트엔드)을 서빙하고, Web Push 구독/발송 API를 제공한다.
// iOS에서는 반드시 HTTPS + 홈 화면에 추가된 PWA 상태에서만 웹 푸시가 동작한다.

const express = require("express");
const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const KEYS_FILE = path.join(__dirname, "vapid-keys.json");
const SUBS_FILE = path.join(__dirname, "subscriptions.json");

function loadVapidKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  if (fs.existsSync(KEYS_FILE)) {
    return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
  }
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
  console.log("새 VAPID 키를 생성해 vapid-keys.json에 저장했습니다.");
  return keys;
}

const vapidKeys = loadVapidKeys();
webpush.setVapidDetails("mailto:example@example.com", vapidKeys.publicKey, vapidKeys.privateKey);

function loadSubs() {
  if (!fs.existsSync(SUBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SUBS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveSubs(subs) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/api/subscribe", (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: "invalid subscription" });
  const subs = loadSubs();
  if (!subs.find((s) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    saveSubs(subs);
  }
  res.json({ ok: true });
});

app.post("/api/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  const subs = loadSubs().filter((s) => s.endpoint !== endpoint);
  saveSubs(subs);
  res.json({ ok: true });
});

app.post("/api/notify", async (req, res) => {
  const { title, body } = req.body || {};
  if (!body) return res.status(400).json({ error: "body is required" });

  const subs = loadSubs();
  if (subs.length === 0) return res.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title: title || "오픽 트레이너", body });
  const results = await Promise.allSettled(subs.map((sub) => webpush.sendNotification(sub, payload)));

  const stillValid = subs.filter((_, i) => {
    const r = results[i];
    const statusCode = r.status === "rejected" && r.reason && r.reason.statusCode;
    return !(statusCode === 404 || statusCode === 410); // 만료/삭제된 구독 정리
  });
  if (stillValid.length !== subs.length) saveSubs(stillValid);

  res.json({ ok: true, sent: subs.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

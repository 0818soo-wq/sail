import { TOPICS, DEFAULTS, QUESTION_TOPICS, QUESTION_TYPES } from "./data.js";
import { PROFILE, profileSummary } from "./profile.js";

const screenHome = document.getElementById("screen-home");
const screenPractice = document.getElementById("screen-practice");
const startBtn = document.getElementById("start-btn");
const homeNote = document.getElementById("home-note");
const tapArea = document.getElementById("tap-area");
const statusText = document.getElementById("status-text");
const sentenceText = document.getElementById("sentence-text");
const progressText = document.getElementById("progress-text");
const exitBtn = document.getElementById("exit-btn");

const supportsTTS = "speechSynthesis" in window;
const supportsPush = "serviceWorker" in navigator && "PushManager" in window;

let englishVoice = null;
let audioCtx = null;
let pushEnabled = false;

// ---------- TTS ----------
// 기기에 설치된 영어 음성 중 가장 자연스러운 것을 고른다.
// (iOS의 Premium/Enhanced, Chrome의 Google 음성이 기본 compact 음성보다 훨씬 낫다)
function voiceScore(voice) {
  const name = (voice.name || "").toLowerCase();
  let score = 0;
  if (name.includes("premium")) score += 100;
  if (name.includes("enhanced")) score += 90;
  if (name.includes("neural") || name.includes("natural")) score += 80;
  if (name.includes("siri")) score += 70;
  if (name.includes("google")) score += 60;
  if (!voice.localService) score += 30;
  if (voice.lang === "en-US") score += 10;
  return score;
}

function pickEnglishVoice() {
  if (!supportsTTS) return;
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
  if (!voices.length) return;
  englishVoice = voices.slice().sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}
if (supportsTTS) {
  pickEnglishVoice();
  window.speechSynthesis.onvoiceschanged = pickEnglishVoice;
}

function speak(text, onend) {
  if (!supportsTTS) {
    if (onend) onend();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (englishVoice) utterance.voice = englishVoice;
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.onend = () => onend && onend();
  utterance.onerror = () => onend && onend();
  window.speechSynthesis.speak(utterance);
}

// ---------- 종료음(띵동) ----------
function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(ctx, freq, startTime, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playChime(onend) {
  const ctx = ensureAudioCtx();
  if (!ctx) {
    if (onend) onend();
    return;
  }
  const now = ctx.currentTime;
  playTone(ctx, 880, now, 0.32); // 띵
  playTone(ctx, 659.25, now + 0.34, 0.55); // 동
  if (onend) setTimeout(onend, 950);
}

// ---------- 워치 알림 (Web Push) ----------
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function enablePush() {
  if (!supportsPush) return false;
  const reg = await navigator.serviceWorker.register("sw.js");
  const existing = await reg.pushManager.getSubscription();
  if (existing) return true;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const { publicKey } = await (await fetch("/api/vapid-public-key")).json();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  return true;
}

function pushToWatch(title, body) {
  if (!pushEnabled) return;
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  }).catch(() => {});
}

// ---------- 문항 큐 ----------
function fillPlaceholders(text) {
  return text
    .replaceAll("{name}", PROFILE.englishName || DEFAULTS.name)
    .replaceAll("{job}", PROFILE.job || DEFAULTS.job)
    .replaceAll("{city}", PROFILE.city || DEFAULTS.city);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 생성 실패 시 쓰는 오프라인 폴백 문항
function fallbackItem() {
  const topics = Object.values(TOPICS);
  const topic = pickRandom(topics);
  const item = pickRandom(Object.values(topic.items));
  return {
    question: fillPlaceholders(item.question),
    sentences: item.sentences.map(fillPlaceholders),
  };
}

// 문항 프리페치: 앱을 열자마자 첫 문항을, 이후에는 한 문항씩 앞서 만들어
// 질문을 듣는 동안 다음 준비가 끝나 있도록 한다
const itemQueue = [];

function prefetchItem() {
  const topic = pickRandom(QUESTION_TOPICS);
  const type = pickRandom(QUESTION_TYPES);
  const request = fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      questionType: type.id,
      questionBrief: type.brief,
      profile: profileSummary(),
    }),
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("generate failed"))))
    .then((d) =>
      d.question && Array.isArray(d.sentences) && d.sentences.length
        ? { question: d.question, sentences: d.sentences }
        : fallbackItem()
    )
    .catch(() => fallbackItem());
  itemQueue.push(request);
}

function takeItem() {
  if (!itemQueue.length) prefetchItem();
  const next = itemQueue.shift();
  prefetchItem(); // 항상 한 문항 앞서 준비
  return next;
}

// ---------- 세션 ----------
let session = null;
// phase: LOADING | Q_PLAYING | Q_DONE | S_PLAYING | S_WAIT | ITEM_DONE

function render() {
  if (!session) return;
  const { phase, sentences, sentenceIndex } = session;

  switch (phase) {
    case "Q_PLAYING":
      statusText.textContent = "🎧 질문 듣는 중";
      sentenceText.textContent = "";
      progressText.textContent = "";
      break;
    case "Q_DONE":
      statusText.textContent = "화면을 터치하세요";
      sentenceText.textContent = "";
      break;
    case "LOADING":
      statusText.textContent = "문제 준비 중...";
      sentenceText.textContent = "";
      progressText.textContent = "";
      break;
    case "S_PLAYING":
    case "S_WAIT":
      statusText.textContent = phase === "S_PLAYING" ? "" : "따라 말한 뒤 터치";
      sentenceText.textContent = sentences[sentenceIndex];
      progressText.textContent = `${sentenceIndex + 1} / ${sentences.length}`;
      break;
    case "ITEM_DONE":
      statusText.textContent = "터치하면 다음 질문";
      sentenceText.textContent = "";
      progressText.textContent = "";
      break;
  }
}

async function nextItem() {
  session.phase = "LOADING";
  render();

  const token = ++session.token;
  const item = await takeItem();
  if (!session || session.token !== token) return;

  session.sentences = item.sentences;
  session.sentenceIndex = 0;
  session.phase = "Q_PLAYING";
  render();
  speak(item.question, () => {
    if (!session || session.token !== token || session.phase !== "Q_PLAYING") return;
    session.phase = "Q_DONE";
    render();
  });
}

function playSentence() {
  const { sentences, sentenceIndex } = session;
  session.phase = "S_PLAYING";
  render();
  pushToWatch(`${sentenceIndex + 1} / ${sentences.length}`, sentences[sentenceIndex]);
  speak(sentences[sentenceIndex], () => {
    if (!session || session.phase !== "S_PLAYING") return;
    if (sentenceIndex + 1 < sentences.length) {
      session.phase = "S_WAIT";
      render();
    } else {
      session.phase = "ITEM_DONE";
      statusText.textContent = "";
      sentenceText.textContent = "";
      playChime(() => {
        if (session && session.phase === "ITEM_DONE") render();
      });
    }
  });
}

function handleTap() {
  if (!session) return;
  ensureAudioCtx();

  switch (session.phase) {
    case "Q_DONE":
      playSentence();
      break;
    case "S_WAIT":
      session.sentenceIndex += 1;
      playSentence();
      break;
    case "ITEM_DONE":
      nextItem();
      break;
    default:
      break; // 재생/로딩 중에는 탭 무시
  }
}

function start() {
  ensureAudioCtx();
  homeNote.textContent = "";

  // 알림 권한 요청은 백그라운드로 - 시작을 막지 않는다
  enablePush()
    .then((ok) => {
      pushEnabled = ok;
    })
    .catch(() => {
      pushEnabled = false;
    });

  session = {
    token: 0,
    sentences: [],
    sentenceIndex: 0,
    phase: "LOADING",
  };

  screenHome.hidden = true;
  screenPractice.hidden = false;
  nextItem();
}

function exitSession() {
  if (supportsTTS) window.speechSynthesis.cancel();
  session = null;
  screenPractice.hidden = true;
  screenHome.hidden = false;
}

startBtn.addEventListener("click", start);
tapArea.addEventListener("click", handleTap);
tapArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleTap();
  }
});
exitBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  exitSession();
});

if (supportsPush) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// 앱을 여는 순간부터 첫 문항을 만들어둔다 - START를 누를 때는 이미 준비된 상태
prefetchItem();

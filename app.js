import { TOPICS, DEFAULTS } from "./data.js";
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

function buildQueue() {
  const items = [];
  for (const [topicId, topic] of Object.entries(TOPICS)) {
    for (const [qType, item] of Object.entries(topic.items)) {
      items.push({
        topicId,
        topicLabel: topic.label,
        qType,
        question: fillPlaceholders(item.question),
        fallback: item.sentences.map(fillPlaceholders),
      });
    }
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// 답변 프리페치: 질문을 듣는 동안 다음 답변을 미리 만들어 대기시간을 없앤다
const answerCache = new Map();

function prefetchAnswer(index) {
  if (!session || index >= session.queue.length || answerCache.has(index)) return;
  const item = session.queue[index];
  const request = fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: item.question,
      topic: item.topicLabel,
      profile: profileSummary(),
    }),
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("generate failed"))))
    .then((d) => (Array.isArray(d.sentences) && d.sentences.length ? d.sentences : item.fallback))
    .catch(() => item.fallback);
  answerCache.set(index, request);
}

// ---------- 세션 ----------
let session = null;
// phase: Q_PLAYING | Q_DONE | LOADING | S_PLAYING | S_WAIT | ITEM_DONE

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
      statusText.textContent = "답변 준비 중...";
      sentenceText.textContent = "";
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

function playQuestion() {
  const item = session.queue[session.index];
  session.phase = "Q_PLAYING";
  render();
  prefetchAnswer(session.index);
  prefetchAnswer(session.index + 1);
  speak(item.question, () => {
    if (!session || session.phase !== "Q_PLAYING") return;
    session.phase = "Q_DONE";
    render();
  });
}

async function startAnswer() {
  session.phase = "LOADING";
  render();
  const index = session.index;
  prefetchAnswer(index);
  const sentences = await answerCache.get(index);
  if (!session || session.index !== index) return;
  session.sentences = sentences;
  session.sentenceIndex = 0;
  playSentence();
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
      startAnswer();
      break;
    case "S_WAIT":
      session.sentenceIndex += 1;
      playSentence();
      break;
    case "ITEM_DONE":
      session.index += 1;
      if (session.index >= session.queue.length) {
        session.queue = buildQueue();
        session.index = 0;
        answerCache.clear();
      }
      playQuestion();
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

  answerCache.clear();
  session = {
    queue: buildQueue(),
    index: 0,
    sentences: [],
    sentenceIndex: 0,
    phase: "Q_PLAYING",
  };

  screenHome.hidden = true;
  screenPractice.hidden = false;
  playQuestion();
}

function exitSession() {
  if (supportsTTS) window.speechSynthesis.cancel();
  session = null;
  answerCache.clear();
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

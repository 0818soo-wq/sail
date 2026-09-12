import { profileSummary } from "./profile.js";

const listenZone = document.getElementById("listen-zone");
const answerZone = document.getElementById("answer-zone");
const listenStatus = document.getElementById("listen-status");
const answerStatus = document.getElementById("answer-status");
const sentenceText = document.getElementById("sentence-text");
const contextText = document.getElementById("context-text");
const progressText = document.getElementById("progress-text");

const supportsTTS = "speechSynthesis" in window;
const supportsPush = "serviceWorker" in navigator && "PushManager" in window;
const supportsMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

let englishVoice = null;
let audioCtx = null;
let pushEnabled = false;
let gestureUnlocked = false;

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
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    const { publicKey } = await (await fetch("/api/vapid-public-key")).json();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  // 서버가 재배포되면 구독 목록이 비므로, 이미 구독돼 있어도 매번 다시 등록한다
  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  return true;
}

// 두 번째 화면(display.html)에 현재 문구를 보낸다
function updateDisplay(title, text) {
  fetch("/api/current", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text }),
  }).catch(() => {});
}

// 표시 화면 갱신 + 워치 알림이 켜져 있으면 푸시도 보낸다
function pushToWatch(title, body) {
  updateDisplay(title, body);
  if (!pushEnabled) return;
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  }).catch(() => {});
}

// 첫 터치에서만: iOS 음성 채널 열기 + 알림 구독 (터치를 막지 않도록 백그라운드)
function unlockOnFirstGesture() {
  ensureAudioCtx();
  if (gestureUnlocked) return;
  gestureUnlocked = true;
  if (supportsTTS) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
  }
  enablePush()
    .then((ok) => {
      pushEnabled = ok;
    })
    .catch(() => {
      pushEnabled = false;
    });
}

// ---------- 마이크로 질문 듣기 ----------
let mediaStream = null;
let recorder = null;
let chunks = [];

function pickRecorderMime() {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

function releaseMic() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  recorder = null;
}

async function startListening() {
  if (supportsTTS) window.speechSynthesis.cancel();
  releaseMic();
  const token = ++session.token;
  session.phase = "LISTENING";
  render();
  updateDisplay("", "🎧 질문 듣는 중");

  if (!supportsMic) {
    session.phase = "MIC_ERROR";
    render();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (session.token !== token) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    mediaStream = stream;
  } catch {
    if (session.token !== token) return;
    session.phase = "MIC_ERROR";
    render();
    return;
  }

  chunks = [];
  const mimeType = pickRecorderMime();
  recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  recorder.start();
}

function stopListening() {
  return new Promise((resolve) => {
    const r = recorder;
    if (!r || r.state === "inactive") {
      releaseMic();
      resolve(new Blob(chunks, { type: "audio/mp4" }));
      return;
    }
    r.onstop = () => {
      const blob = new Blob(chunks, { type: r.mimeType || "audio/mp4" });
      releaseMic();
      resolve(blob);
    };
    r.stop();
  });
}

// ---------- 세션 ----------
// phase: IDLE | LISTENING | PROCESSING | S_PLAYING | S_WAIT | S_PENDING | ITEM_DONE | ERROR | MIC_ERROR
const session = {
  token: 0,
  phase: "IDLE",
  question: "",
  sentences: [],
  sentenceIndex: 0,
  chunkIndex: 0,
  streamDone: false,
  errorMessage: "",
};

// 한 문장을 3단어씩 끊는다. 마지막에 1단어만 남으면 앞 덩어리에 붙인다.
const CHUNK_WORDS = 3;
function chunkSentence(sentence) {
  const words = sentence.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += CHUNK_WORDS) {
    chunks.push(words.slice(i, i + CHUNK_WORDS).join(" "));
  }
  if (chunks.length > 1 && chunks[chunks.length - 1].split(" ").length === 1) {
    const last = chunks.pop();
    chunks[chunks.length - 1] += " " + last;
  }
  return chunks;
}

function currentChunks() {
  return chunkSentence(session.sentences[session.sentenceIndex]);
}

const ERROR_MESSAGES = {
  no_speech: "질문이 들리지 않았어요",
  transcription_failed: "음성 인식 서버 오류",
  generation_failed: "답변을 만들지 못했어요",
  "empty audio": "녹음된 소리가 없어요 · 마이크 권한을 확인하세요",
  "OPENAI_API_KEY is not set": "서버에 음성 인식 키가 없어요",
  "ANTHROPIC_API_KEY is not set": "서버에 Claude 키가 없어요",
};

// 서버가 돌려준 실패 원인을 화면에 그대로 보여준다 - 어떤 키/계정 문제인지 바로 알 수 있게
function describeFailure(payload) {
  const code = payload && payload.error;
  let message = ERROR_MESSAGES[code] || "문제가 생겼어요";
  if (code === "transcription_failed") {
    if (payload.status === 401) message = "OpenAI 키가 잘못됐어요";
    else if (payload.status === 429) message = "OpenAI 크레딧 또는 사용 한도가 없어요";
    else if (payload.status) message += ` (${payload.status})`;
    if (payload.detail) message += `\n${String(payload.detail).slice(0, 160)}`;
  }
  return message;
}

function renderContext(chunks, currentIndex) {
  contextText.textContent = "";
  chunks.forEach((chunk, i) => {
    const span = document.createElement("span");
    span.textContent = (i > 0 ? " " : "") + chunk;
    if (i === currentIndex) span.className = "cur";
    else if (i < currentIndex) span.className = "done";
    contextText.appendChild(span);
  });
}

function render() {
  const { phase, sentences, sentenceIndex, chunkIndex, streamDone } = session;
  const total = streamDone ? String(sentences.length) : "…";

  listenZone.classList.toggle("recording", phase === "LISTENING");
  sentenceText.textContent = "";
  contextText.textContent = "";
  answerStatus.textContent = "";
  progressText.textContent = "";

  switch (phase) {
    case "IDLE":
      listenStatus.textContent = "터치해서 질문 듣기";
      break;
    case "LISTENING":
      listenStatus.textContent = "🎧 듣는 중 · 질문이 끝나면 아래를 터치";
      answerStatus.textContent = "질문이 끝나면 터치";
      break;
    case "PROCESSING":
      listenStatus.textContent = "듣기 완료";
      answerStatus.textContent = "답변 만드는 중...";
      break;
    case "S_PLAYING":
    case "S_WAIT": {
      const chunks = currentChunks();
      listenStatus.textContent = "다음 질문은 여기 터치";
      sentenceText.textContent = chunks[chunkIndex];
      renderContext(chunks, chunkIndex);
      answerStatus.textContent = phase === "S_WAIT" ? "따라 말한 뒤 터치" : "";
      progressText.textContent = `문장 ${sentenceIndex + 1} / ${total} · ${chunkIndex + 1} / ${chunks.length}`;
      break;
    }
    case "S_PENDING":
      listenStatus.textContent = "다음 질문은 여기 터치";
      answerStatus.textContent = "다음 문장 준비 중...";
      progressText.textContent = `문장 ${sentenceIndex + 1} / ${total}`;
      break;
    case "ITEM_DONE":
      listenStatus.textContent = "터치해서 다음 질문 듣기";
      answerStatus.textContent = "✅ 답변 끝";
      break;
    case "ERROR":
      listenStatus.textContent = "터치해서 다시 듣기";
      answerStatus.textContent = session.errorMessage;
      break;
    case "MIC_ERROR":
      listenStatus.textContent = "마이크를 사용할 수 없어요 · 설정에서 허용한 뒤 터치";
      break;
  }
}

function playChunk() {
  const si = session.sentenceIndex;
  const ci = session.chunkIndex;
  const chunks = currentChunks();
  const text = chunks[ci];
  session.phase = "S_PLAYING";
  render();
  pushToWatch(
    `${si + 1}${session.streamDone ? ` / ${session.sentences.length}` : ""} · ${ci + 1}/${chunks.length}`,
    text
  );
  speak(text, () => {
    if (session.phase !== "S_PLAYING" || session.sentenceIndex !== si || session.chunkIndex !== ci) return;
    const hasMore = ci + 1 < chunks.length || si + 1 < session.sentences.length || !session.streamDone;
    if (hasMore) {
      session.phase = "S_WAIT";
      render();
    } else {
      finishItem();
    }
  });
}

function finishItem() {
  session.phase = "ITEM_DONE";
  render();
  answerStatus.textContent = "";
  updateDisplay("", "✅ 답변 끝");
  playChime(() => {
    if (session.phase === "ITEM_DONE") render();
  });
}

function showError(message) {
  session.phase = "ERROR";
  session.errorMessage = message;
  render();
}

// 스트리밍으로 문장이 도착하거나 스트림이 끝났을 때, 기다리던 상태를 풀어준다
function onSentencesUpdated() {
  const { phase, sentences, sentenceIndex, chunkIndex, streamDone } = session;
  if (phase === "PROCESSING") {
    if (sentences.length > 0) {
      session.sentenceIndex = 0;
      session.chunkIndex = 0;
      playChunk();
    } else if (streamDone) {
      showError(ERROR_MESSAGES.generation_failed);
    }
  } else if (phase === "S_PENDING") {
    if (sentences[sentenceIndex]) {
      session.chunkIndex = 0;
      playChunk();
    } else if (streamDone) {
      finishItem();
    }
  } else if (
    phase === "S_WAIT" &&
    streamDone &&
    sentenceIndex + 1 >= sentences.length &&
    chunkIndex + 1 >= currentChunks().length
  ) {
    finishItem(); // 마지막 덩어리였음이 뒤늦게 확정된 경우 - 터치 없이 바로 종료음
  }
}

async function submitQuestion() {
  const token = ++session.token;
  session.phase = "PROCESSING";
  session.sentences = [];
  session.sentenceIndex = 0;
  session.chunkIndex = 0;
  session.streamDone = false;
  session.question = "";
  render();
  updateDisplay("", "답변 만드는 중...");

  const blob = await stopListening();
  if (session.token !== token) return;

  const handleLine = (msg) => {
    if (msg.error) throw new Error(describeFailure(msg));
    if (msg.question) session.question = msg.question;
    if (msg.sentence) {
      session.sentences.push(msg.sentence);
      onSentencesUpdated();
    }
  };

  try {
    const res = await fetch("/api/answer", {
      method: "POST",
      headers: {
        "Content-Type": blob.type || "audio/mp4",
        "X-Profile": encodeURIComponent(profileSummary()),
      },
      body: blob,
    });
    if (session.token !== token) return;
    if (!res.ok) {
      let payload = { error: "generation_failed" };
      try {
        payload = await res.json();
      } catch {}
      throw new Error(describeFailure(payload));
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (session.token !== token) return;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) handleLine(JSON.parse(line));
      }
    }
    if (buffer.trim()) handleLine(JSON.parse(buffer.trim()));

    session.streamDone = true;
    onSentencesUpdated();
  } catch (err) {
    if (session.token !== token) return;
    showError((err && err.message) || "문제가 생겼어요");
  }
}

// 위 절반: 어떤 상태에서든 새 질문 듣기 시작 (진행 중이던 답변은 버린다)
function onListenTap() {
  unlockOnFirstGesture();
  startListening();
}

// 아래 절반: 듣기 중이면 답변 시작, 답변 중이면 다음 3단어
function onAnswerTap() {
  unlockOnFirstGesture();
  switch (session.phase) {
    case "LISTENING":
      submitQuestion();
      break;
    case "S_WAIT": {
      if (session.chunkIndex + 1 < currentChunks().length) {
        session.chunkIndex += 1;
        playChunk();
        break;
      }
      const next = session.sentenceIndex + 1;
      if (session.sentences[next]) {
        session.sentenceIndex = next;
        session.chunkIndex = 0;
        playChunk();
      } else if (session.streamDone) {
        finishItem();
      } else {
        session.sentenceIndex = next;
        session.chunkIndex = 0;
        session.phase = "S_PENDING";
        render();
      }
      break;
    }
    default:
      break; // 재생/처리 중이거나 답변이 없는 상태에서는 무시
  }
}

listenZone.addEventListener("click", onListenTap);
answerZone.addEventListener("click", onAnswerTap);
listenZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onListenTap();
  }
});
answerZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onAnswerTap();
  }
});

if (supportsPush) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();

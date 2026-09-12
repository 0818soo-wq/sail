import { TOPICS, QTYPE_LABELS, DEFAULTS } from "./data.js";

const screenTopics = document.getElementById("screen-topics");
const screenPractice = document.getElementById("screen-practice");
const topicGrid = document.getElementById("topic-grid");
const nameInput = document.getElementById("name-input");
const jobInput = document.getElementById("job-input");
const cityInput = document.getElementById("city-input");
const backBtn = document.getElementById("back-btn");
const progressText = document.getElementById("progress-text");
const tapArea = document.getElementById("tap-area");
const hintText = document.getElementById("hint-text");
const mainText = document.getElementById("main-text");
const sentenceList = document.getElementById("sentence-list");

const supportsTTS = "speechSynthesis" in window;
let englishVoice = null;
let audioCtx = null;

// ---------- 주제 목록 렌더링 ----------
Object.entries(TOPICS).forEach(([topicId, topic]) => {
  const card = document.createElement("div");
  card.className = "topic-card";
  card.textContent = topic.label;
  card.addEventListener("click", () => startTopic(topicId));
  topicGrid.appendChild(card);
});

// ---------- TTS 음성 선택 ----------
function pickEnglishVoice() {
  if (!supportsTTS) return;
  const voices = window.speechSynthesis.getVoices();
  englishVoice =
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang && v.lang.startsWith("en")) ||
    voices[0] ||
    null;
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
  utterance.rate = 0.92;
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

// ---------- 세션 상태 ----------
let session = null;
/*
session = {
  topicId, inputs: {name, job, city},
  items: [{ qType, question, sentences }],
  itemIndex, sentenceIndex,
  phase: 'Q_READY' | 'Q_PLAYING' | 'A_READY' | 'A_GENERATING' | 'S_READY' | 'S_PLAYING' | 'ITEM_DONE' | 'SESSION_DONE'
}
*/

function fillPlaceholders(text, inputs) {
  return text
    .replaceAll("{name}", inputs.name)
    .replaceAll("{job}", inputs.job)
    .replaceAll("{city}", inputs.city);
}

function startTopic(topicId) {
  const topic = TOPICS[topicId];
  const inputs = {
    name: nameInput.value.trim() || DEFAULTS.name,
    job: jobInput.value.trim() || DEFAULTS.job,
    city: cityInput.value.trim() || DEFAULTS.city,
  };

  const items = Object.entries(topic.items).map(([qType, item]) => ({
    qType,
    question: fillPlaceholders(item.question, inputs),
    sentences: item.sentences.map((s) => fillPlaceholders(s, inputs)),
  }));

  session = {
    topicId,
    topicLabel: topic.label,
    inputs,
    items,
    itemIndex: 0,
    sentenceIndex: 0,
    phase: "Q_READY",
  };

  screenTopics.hidden = true;
  screenPractice.hidden = false;
  renderPractice();
}

function goBackToTopics() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  session = null;
  screenPractice.hidden = true;
  screenTopics.hidden = false;
}

function currentItem() {
  return session.items[session.itemIndex];
}

function renderPractice() {
  const item = currentItem();
  const total = session.items.length;
  const qTypeLabel = QTYPE_LABELS[item.qType] || "";

  progressText.textContent = `${session.topicLabel} · 문항 ${session.itemIndex + 1}/${total} (${qTypeLabel})`;

  switch (session.phase) {
    case "Q_READY":
      hintText.textContent = "터치해서 질문 듣기";
      mainText.textContent = item.question;
      sentenceList.innerHTML = "";
      break;
    case "Q_PLAYING":
      hintText.textContent = "질문 재생 중...";
      mainText.textContent = item.question;
      sentenceList.innerHTML = "";
      break;
    case "A_READY":
      hintText.textContent = "터치해서 답변 생성하기";
      mainText.textContent = "";
      sentenceList.innerHTML = "";
      break;
    case "A_GENERATING":
      hintText.textContent = "";
      mainText.textContent = "답변 생성 중...";
      sentenceList.innerHTML = "";
      break;
    case "S_READY":
    case "S_PLAYING":
      hintText.textContent =
        session.phase === "S_READY" ? "터치해서 다음 문장 듣기" : "재생 중... 따라 말해보세요";
      mainText.textContent = "";
      renderSentenceList(item.sentences, session.sentenceIndex);
      break;
    case "ITEM_DONE":
      hintText.textContent =
        session.itemIndex + 1 < total ? "터치해서 다음 질문으로" : "터치해서 완료";
      mainText.textContent = "✅ 답변 완료!";
      renderSentenceList(item.sentences, item.sentences.length);
      break;
    case "SESSION_DONE":
      hintText.textContent = "터치해서 주제 선택으로";
      mainText.textContent = "🎉 이 주제를 모두 마쳤습니다!";
      sentenceList.innerHTML = "";
      break;
  }
}

function renderSentenceList(sentences, activeIndex) {
  sentenceList.innerHTML = "";
  sentences.forEach((s, i) => {
    const p = document.createElement("p");
    p.className = "s-line";
    if (i < activeIndex) p.classList.add("done");
    else if (i === activeIndex) p.classList.add("current");
    else p.classList.add("upcoming");
    p.textContent = s;
    sentenceList.appendChild(p);
  });
}

function handleTap() {
  if (!session) return;
  ensureAudioCtx();
  const item = currentItem();

  switch (session.phase) {
    case "Q_READY":
      session.phase = "Q_PLAYING";
      renderPractice();
      speak(item.question, () => {
        session.phase = "A_READY";
        renderPractice();
      });
      break;

    case "A_READY":
      session.phase = "A_GENERATING";
      renderPractice();
      setTimeout(() => {
        session.sentenceIndex = 0;
        session.phase = "S_READY";
        renderPractice();
      }, 700);
      break;

    case "S_READY": {
      session.phase = "S_PLAYING";
      renderPractice();
      const idx = session.sentenceIndex;
      speak(item.sentences[idx], () => {
        if (idx + 1 < item.sentences.length) {
          session.sentenceIndex = idx + 1;
          session.phase = "S_READY";
          renderPractice();
        } else {
          session.phase = "ITEM_DONE";
          renderSentenceList(item.sentences, item.sentences.length);
          hintText.textContent = "";
          playChime(() => {
            renderPractice();
          });
        }
      });
      break;
    }

    case "ITEM_DONE":
      if (session.itemIndex + 1 < session.items.length) {
        session.itemIndex += 1;
        session.sentenceIndex = 0;
        session.phase = "Q_READY";
      } else {
        session.phase = "SESSION_DONE";
      }
      renderPractice();
      break;

    case "SESSION_DONE":
      goBackToTopics();
      break;

    // Q_PLAYING, A_GENERATING, S_PLAYING: 재생/생성 중에는 탭 무시
    default:
      break;
  }
}

tapArea.addEventListener("click", handleTap);
tapArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleTap();
  }
});

backBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  goBackToTopics();
});

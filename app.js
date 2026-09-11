import { LEVELS, TOPICS, FILLERS, QTYPE_LABELS, DEFAULTS } from "./data.js";

const levelSelect = document.getElementById("level-select");
const topicSelect = document.getElementById("topic-select");
const nameInput = document.getElementById("name-input");
const jobInput = document.getElementById("job-input");
const cityInput = document.getElementById("city-input");
const generateBtn = document.getElementById("generate-btn");
const speakAllBtn = document.getElementById("speak-all-btn");
const stopSpeakBtn = document.getElementById("stop-speak-btn");
const resultsEl = document.getElementById("results");

const supportsTTS = "speechSynthesis" in window;
let currentAnswers = []; // [{ label, text }]
let englishVoice = null;

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
} else {
  speakAllBtn.title = "이 브라우저는 음성 합성을 지원하지 않습니다.";
  stopSpeakBtn.title = "이 브라우저는 음성 합성을 지원하지 않습니다.";
}

function populateSelect(selectEl, items, valueFn, labelFn) {
  selectEl.innerHTML = "";
  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = valueFn(item);
    opt.textContent = labelFn(item);
    selectEl.appendChild(opt);
  });
}

populateSelect(levelSelect, LEVELS, (l) => l.id, (l) => l.label);
populateSelect(
  topicSelect,
  Object.entries(TOPICS),
  ([id]) => id,
  ([, topic]) => topic.label
);

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillPlaceholders(template, inputs) {
  return template
    .replaceAll("{name}", inputs.name)
    .replaceAll("{job}", inputs.job)
    .replaceAll("{city}", inputs.city);
}

function composeAnswer(template, level, inputs) {
  const filler = FILLERS[level];
  const opener = pickRandom(filler.openers);
  const closer = pickRandom(filler.closers);
  const body = fillPlaceholders(template, inputs);
  return `${opener} ${body} ${closer}`;
}

function generateAnswers() {
  const level = levelSelect.value;
  const topicId = topicSelect.value;
  const topic = TOPICS[topicId];
  const inputs = {
    name: nameInput.value.trim() || DEFAULTS.name,
    job: jobInput.value.trim() || DEFAULTS.job,
    city: cityInput.value.trim() || DEFAULTS.city,
  };

  const qTypes = Object.keys(topic.templates);
  currentAnswers = qTypes.map((qType) => {
    const template = topic.templates[qType][level];
    return {
      label: QTYPE_LABELS[qType] || qType,
      text: composeAnswer(template, level, inputs),
    };
  });

  renderAnswers();
}

function renderAnswers() {
  resultsEl.innerHTML = "";

  if (currentAnswers.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder";
    p.textContent = "주제와 레벨을 선택한 뒤 '답변 생성하기'를 눌러보세요.";
    resultsEl.appendChild(p);
    speakAllBtn.disabled = true;
    stopSpeakBtn.disabled = true;
    return;
  }

  currentAnswers.forEach((answer, index) => {
    const card = document.createElement("article");
    card.className = "answer-card";

    const header = document.createElement("div");
    header.className = "answer-card-header";
    const h3 = document.createElement("h3");
    h3.textContent = answer.label;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = levelSelect.value;
    header.appendChild(h3);
    header.appendChild(badge);

    const p = document.createElement("p");
    p.className = "answer-text";
    p.textContent = answer.text;

    const footer = document.createElement("div");
    footer.className = "answer-card-footer";
    const speakBtn = document.createElement("button");
    speakBtn.className = "secondary";
    speakBtn.textContent = "🔊 듣기";
    speakBtn.disabled = !supportsTTS;
    speakBtn.addEventListener("click", () => speak(answer.text));
    footer.appendChild(speakBtn);

    card.appendChild(header);
    card.appendChild(p);
    card.appendChild(footer);
    resultsEl.appendChild(card);
  });

  speakAllBtn.disabled = !supportsTTS;
  stopSpeakBtn.disabled = !supportsTTS;
}

function speak(text, onend) {
  if (!supportsTTS) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (englishVoice) utterance.voice = englishVoice;
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  if (onend) utterance.onend = onend;
  window.speechSynthesis.speak(utterance);
}

function speakAll() {
  if (!supportsTTS || currentAnswers.length === 0) return;
  window.speechSynthesis.cancel();
  let i = 0;
  const next = () => {
    if (i >= currentAnswers.length) return;
    const text = currentAnswers[i].text;
    i += 1;
    speak(text, next);
  };
  next();
}

generateBtn.addEventListener("click", generateAnswers);
speakAllBtn.addEventListener("click", speakAll);
stopSpeakBtn.addEventListener("click", () => {
  if (supportsTTS) window.speechSynthesis.cancel();
});

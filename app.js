const dailyWords = [
  { verse: "“Be still, and know that I am God.”", reference: "PSALM 46:10 · KJV", prompt: "Where might you make room for stillness today?" },
  { verse: "“The Lord is my shepherd; I shall not want.”", reference: "PSALM 23:1 · KJV", prompt: "What would it look like to trust God's care in one part of your day?" },
  { verse: "“I can do all things through Christ which strengtheneth me.”", reference: "PHILIPPIANS 4:13 · KJV", prompt: "Where do you need strength for the next step, not the whole journey?" },
  { verse: "“Let all your things be done with charity.”", reference: "1 CORINTHIANS 16:14 · KJV", prompt: "How could love shape one conversation or choice today?" },
  { verse: "“Trust in the LORD with all thine heart.”", reference: "PROVERBS 3:5 · KJV", prompt: "What are you holding that you could place in God's hands?" },
  { verse: "“For we walk by faith, not by sight.”", reference: "2 CORINTHIANS 5:7 · KJV", prompt: "What faithful step can you take before you have every answer?" },
  { verse: "“Come unto me, all ye that labour and are heavy laden, and I will give you rest.”", reference: "MATTHEW 11:28 · KJV", prompt: "What would it mean to receive rest instead of earning it today?" },
];
const dailyPracticeKey = "preachselah-daily-practice";
const reflectionStatus = document.getElementById("reflection-status");
const reflectionInput = document.getElementById("reflection-input");
const completeReflectionButton = document.getElementById("complete-reflection");
const localDateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
const shiftDateKey = (dateKey, days) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};
const today = localDateKey(new Date());
const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
const dayNumber = Math.floor(Date.UTC(todayYear, todayMonth - 1, todayDay) / 86400000);
const dailyWord = dailyWords[((dayNumber % dailyWords.length) + dailyWords.length) % dailyWords.length];
document.getElementById("daily-verse").textContent = dailyWord.verse;
document.getElementById("daily-reference").textContent = dailyWord.reference;
document.getElementById("reflection-prompt").textContent = dailyWord.prompt;

let dailyPractice = { checkIns: [], reflectionDate: "", reflection: "" };
try {
  const savedPractice = JSON.parse(localStorage.getItem(dailyPracticeKey) || "null");
  if (savedPractice && typeof savedPractice === "object" && !Array.isArray(savedPractice)) {
    dailyPractice.checkIns = Array.isArray(savedPractice.checkIns)
      ? [...new Set(savedPractice.checkIns.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort().slice(-400)
      : [];
    dailyPractice.reflectionDate = typeof savedPractice.reflectionDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(savedPractice.reflectionDate) ? savedPractice.reflectionDate : "";
    dailyPractice.reflection = typeof savedPractice.reflection === "string" ? savedPractice.reflection.slice(0, 1000) : "";
  }
} catch {
  reflectionStatus.textContent = "Your saved reflection could not be read. You can still write and save a new one.";
}
if (dailyPractice.reflectionDate === today) reflectionInput.value = dailyPractice.reflection;

function saveDailyPractice(message) {
  try {
    localStorage.setItem(dailyPracticeKey, JSON.stringify(dailyPractice));
    reflectionStatus.textContent = message;
  } catch {
    reflectionStatus.textContent = "Saved for this visit, but browser storage is unavailable.";
  }
}

function renderDailyPractice() {
  const checkIns = new Set(dailyPractice.checkIns);
  const todayIsComplete = checkIns.has(today);
  const anchorDate = todayIsComplete ? today : shiftDateKey(today, -1);
  let streak = 0;
  for (let date = anchorDate; checkIns.has(date); date = shiftDateKey(date, -1)) streak += 1;
  document.getElementById("streak-count").textContent = String(streak);
  completeReflectionButton.disabled = todayIsComplete;
  completeReflectionButton.innerHTML = todayIsComplete
    ? "Today’s pause is complete <span>✓</span>"
    : "Complete today <span>✓</span>";

  const week = document.getElementById("streak-week");
  week.replaceChildren(...Array.from({ length: 7 }, (_, index) => {
    const dateKey = shiftDateKey(today, index - 6);
    const date = new Date(`${dateKey}T12:00:00`);
    const complete = checkIns.has(dateKey);
    const day = document.createElement("span");
    day.className = `streak-day${complete ? " complete" : ""}${dateKey === today ? " current" : ""}`;
    day.setAttribute("role", "img");
    day.setAttribute("aria-label", `${date.toLocaleDateString(undefined, { weekday: "long" })}: ${complete ? "complete" : "not complete"}`);
    day.title = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    const label = document.createElement("span");
    label.textContent = date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);
    const marker = document.createElement("span");
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = complete ? "✓" : "";
    day.append(label, marker);
    return day;
  }));
}

document.getElementById("save-reflection").addEventListener("click", () => {
  const reflection = reflectionInput.value.trim();
  if (!reflection) {
    reflectionStatus.textContent = "Write a thought before saving your reflection.";
    reflectionInput.focus();
    return;
  }
  dailyPractice.reflectionDate = today;
  dailyPractice.reflection = reflection;
  saveDailyPractice("Your reflection is saved in this browser.");
});
completeReflectionButton.addEventListener("click", () => {
  if (!dailyPractice.checkIns.includes(today)) {
    dailyPractice.checkIns.push(today);
    dailyPractice.checkIns.sort();
    dailyPractice.checkIns = dailyPractice.checkIns.slice(-400);
    saveDailyPractice("Lovely work. Your daily pause is complete.");
    renderDailyPractice();
  }
});
renderDailyPractice();

const timerDisplay = document.getElementById("timer-display");
const timerToggle = document.getElementById("timer-toggle");
const timerReset = document.getElementById("timer-reset");
const timerStatus = document.getElementById("timer-status");
const durationNote = document.getElementById("reflection-duration-note");
let selectedDuration = 300;
let remainingSeconds = selectedDuration;
let timerEndsAt = 0;
let timerInterval = null;

function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  timerDisplay.setAttribute("aria-label", `${minutes} minutes ${seconds} seconds remaining`);
  timerToggle.textContent = timerInterval === null ? "Start" : "Pause";
  document.querySelectorAll(".timer-preset").forEach((button) => {
    const active = Number(button.dataset.duration) === selectedDuration;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function setTimerDuration(duration, message) {
  stopTimer();
  selectedDuration = duration;
  remainingSeconds = duration;
  renderTimer();
  if (message) timerStatus.textContent = message;
}

function suggestReflectionDuration(topic) {
  const topicContext = `${topic.title} ${topic.category} ${topic.hint}`;
  const duration = /\b(wait(?:ing)?|forgiv\w*|purpose|faith|grace|peace|hope|trust|season|anxiety|calling|reconcil\w*|renewal)\b/i.test(topicContext)
    ? 300
    : 120;
  durationNote.textContent = `Suggested: ${duration / 60} min for “${topic.title}”`;
  if (timerInterval === null) {
    setTimerDuration(duration, `A ${duration / 60}-minute reflection is suggested for this topic.`);
  }
}

timerToggle.addEventListener("click", () => {
  if (timerInterval !== null) {
    remainingSeconds = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    stopTimer();
    timerStatus.textContent = "Paused. Start again whenever you’re ready.";
    renderTimer();
    return;
  }
  if (remainingSeconds <= 0) remainingSeconds = selectedDuration;
  timerEndsAt = Date.now() + remainingSeconds * 1000;
  timerStatus.textContent = "Take a slow breath and stay with the thought.";
  timerInterval = window.setInterval(() => {
    remainingSeconds = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    renderTimer();
    if (remainingSeconds === 0) {
      stopTimer();
      timerStatus.textContent = "Your reflection time is complete. Carry one thought with you.";
      renderTimer();
    }
  }, 250);
  renderTimer();
});
timerReset.addEventListener("click", () => {
  setTimerDuration(selectedDuration, "Timer reset. Begin when you’re ready.");
});
document.querySelectorAll(".timer-preset").forEach((button) => {
  button.addEventListener("click", () => {
    const duration = Number(button.dataset.duration);
    if (duration !== 120 && duration !== 300) return;
    setTimerDuration(duration, `Your ${duration / 60}-minute reflection is ready.`);
  });
});
renderTimer();

const defaultTopics = JSON.parse(document.getElementById("topic-data").textContent);
const topicList = document.getElementById("topic-list");
let customTopics = [];
try {
  const savedTopics = JSON.parse(localStorage.getItem("preachselah-custom-topics") || "[]");
  if (Array.isArray(savedTopics)) {
    customTopics = savedTopics.filter((topic) =>
      topic && typeof topic.title === "string" && typeof topic.category === "string" &&
      typeof topic.reference === "string" &&
      typeof topic.verse === "string" && typeof topic.hint === "string" &&
      Array.isArray(topic.points) && topic.points.every((point) => typeof point === "string")
    );
  }
} catch {}
let topics = [...defaultTopics, ...customTopics];
let currentTopic = 0;

function saveCustomTopics() {
  try {
    localStorage.setItem("preachselah-custom-topics", JSON.stringify(customTopics));
    return true;
  } catch {
    return false;
  }
}

function clearSavedTopics() {
  try {
    localStorage.removeItem("preachselah-custom-topics");
    return true;
  } catch {
    return false;
  }
}

function renderTopicButtons() {
  topicList.replaceChildren(...topics.map((topic, index) => {
    const button = document.createElement("button");
    button.className = `topic-chip${index === currentTopic ? " active" : ""}`;
    button.type = "button";
    button.dataset.topic = String(index);
    const dot = document.createElement("span");
    dot.className = "topic-chip-dot";
    button.append(dot, document.createTextNode(topic.title));
    button.addEventListener("click", () => showTopic(index));
    return button;
  }));
}

function showTopic(index) {
  if (index < 0 || index >= topics.length) return;
  currentTopic = index;
  const topic = topics[index];
  suggestReflectionDuration(topic);
  document.getElementById("topic-category").textContent = topic.category;
  document.getElementById("topic-title").textContent = topic.title;
  document.getElementById("topic-reference").replaceChildren(
    document.createTextNode(`${topic.reference} `),
    Object.assign(document.createElement("span"), { textContent: "↗" })
  );
  document.getElementById("topic-verse").textContent = `“${topic.verse}”`;
  document.getElementById("topic-hint").textContent = topic.hint;
  const points = document.getElementById("topic-points");
  points.replaceChildren(...topic.points.map((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    return item;
  }));
  topicList.querySelectorAll(".topic-chip").forEach((button, buttonIndex) =>
    button.classList.toggle("active", buttonIndex === index)
  );
}

renderTopicButtons();
showTopic(0);
const sidebarLinks = [...document.querySelectorAll(".sidebar-link")];
sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    sidebarLinks.forEach((item) => item.classList.toggle("active", item === link));
  });
});
document.getElementById("surprise-button").addEventListener("click", () => {
  if (topics.length > 1) {
    const next = Math.floor(Math.random() * (topics.length - 1));
    showTopic(next >= currentTopic ? next + 1 : next);
  }
});
document.getElementById("reset-topics").addEventListener("click", () => {
  customTopics = [];
  topics = [...defaultTopics];
  currentTopic = 0;
  const cleared = clearSavedTopics();
  renderTopicButtons();
  showTopic(0);
  document.getElementById("topic-form-message").textContent = cleared
    ? "Your original topic suggestions are back."
    : "Your original suggestions are back for now, but browser storage could not be cleared.";
});
document.getElementById("custom-topic-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("custom-topic-input");
  const message = document.getElementById("topic-form-message");
  const submitButton = document.getElementById("create-topic-button");
  const title = input.value.trim();
  if (!title) {
    message.textContent = "Enter a topic to get started.";
    return;
  }
  submitButton.disabled = true;
  message.textContent = "Finding a Scripture starting point…";
  try {
    const response = await fetch("/api/topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const topic = await response.json();
    if (!response.ok) throw new Error(topic.error || "Your topic could not be created.");
    const existingIndex = topics.findIndex((item) => item.title.toLocaleLowerCase() === topic.title.toLocaleLowerCase());
    if (existingIndex !== -1) {
      showTopic(existingIndex);
    } else {
      customTopics.push(topic);
      topics.push(topic);
      currentTopic = topics.length - 1;
      renderTopicButtons();
      showTopic(currentTopic);
    }
    input.value = "";
    const saved = saveCustomTopics();
    message.textContent = saved
      ? `“${topic.title}” is ready. Your custom topics stay saved in this browser until reset.`
      : `“${topic.title}” is ready, but browser storage is unavailable so it will not stay after you leave.`;
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
document.getElementById("copy-topic").addEventListener("click", async (event) => {
  const topic = topics[currentTopic];
  const notes = `${topic.title} — ${topic.reference}\n\n${topic.verse}\n\n${topic.hint}\n\n${topic.points.map((point, index) => `${index + 1}. ${point}`).join("\n")}`;
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(notes);
    button.innerHTML = "Copied <span>✓</span>";
    window.setTimeout(() => { button.innerHTML = 'Copy notes <span>⧉</span>'; }, 1800);
  } catch {
    button.textContent = "Copy unavailable";
    window.setTimeout(() => { button.innerHTML = 'Copy notes <span>⧉</span>'; }, 1800);
  }
});

const bookSelect = document.getElementById("book-select");
const chapterSelect = document.getElementById("chapter-select");
const placeholder = document.getElementById("reader-placeholder");
const loading = document.getElementById("reader-loading");
const errorBox = document.getElementById("reader-error");
const chapterText = document.getElementById("chapter-text");

function updateChapters() {
  const total = Number(bookSelect.selectedOptions[0].dataset.chapters);
  chapterSelect.replaceChildren(...Array.from({ length: total }, (_, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = `Chapter ${index + 1}`;
    return option;
  }));
}

async function loadChapter() {
  const book = bookSelect.value;
  const chapter = chapterSelect.value;
  placeholder.hidden = true;
  chapterText.hidden = true;
  errorBox.hidden = true;
  loading.hidden = false;
  document.getElementById("load-chapter").disabled = true;
  try {
    const response = await fetch(`/api/chapter?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The chapter could not be loaded.");
    document.getElementById("chapter-title").textContent = data.reference;
    const verses = document.getElementById("chapter-verses");
    verses.replaceChildren(...data.verses.map((verse) => {
      const paragraph = document.createElement("p");
      paragraph.className = "bible-verse";
      const number = document.createElement("sup");
      number.textContent = verse.number;
      paragraph.append(number, document.createTextNode(` ${verse.text}`));
      return paragraph;
    }));
    chapterText.hidden = false;
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  } finally {
    loading.hidden = true;
    document.getElementById("load-chapter").disabled = false;
  }
}

bookSelect.addEventListener("change", updateChapters);
document.getElementById("load-chapter").addEventListener("click", loadChapter);
document.getElementById("read-first-chapter").addEventListener("click", () => {
  bookSelect.value = "Genesis";
  updateChapters();
  chapterSelect.value = "1";
  loadChapter();
  document.getElementById("bible").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("topic-reference").addEventListener("click", () => {
  const [book, chapter] = topics[currentTopic].reference.match(/^(.*)\s+(\d+)/).slice(1);
  bookSelect.value = book;
  updateChapters();
  chapterSelect.value = chapter;
  loadChapter();
});
updateChapters();

const welcomeModal = document.getElementById("welcome-modal");
if (welcomeModal) {
  const closeWelcome = () => {
    welcomeModal.remove();
    document.getElementById("topics").scrollIntoView({ behavior: "smooth" });
  };
  document.getElementById("welcome-close").addEventListener("click", closeWelcome);
  document.getElementById("welcome-begin").addEventListener("click", closeWelcome);
  welcomeModal.addEventListener("click", (event) => {
    if (event.target === welcomeModal) closeWelcome();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && welcomeModal.isConnected) closeWelcome();
  });
  document.getElementById("welcome-begin").focus();
}

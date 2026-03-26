//* ── Config ─────────────────────────────────────────────────────────────────
/* Single source of truth for durations and visual properties per mode.
   To add or tweak a mode, only edit this object. */
const MODES = {
  work: {
    duration: 1500, // 25 min
    label: "Pomodoro",
    cssClass: "workMode",
    message: "Time to focus",
  },
  shortBreak: {
    duration: 300, // 5 min
    label: "Short break",
    cssClass: "shortBreakMode",
    message: "Time for rest",
  },
  longBreak: {
    duration: 900, // 15 min
    label: "Long break",
    cssClass: "longBreakMode",
    message: "Time for rest",
  },
};

// let instead of const — user can change this from settings
let POMODOROS_BEFORE_LONG_BREAK = 4;

//* ── State ─────────────────────────────────────────────────────────────────
let timeLeft = MODES.work.duration;
let running = false;
let pomodoroCount = 0; // work blocks in the current round (resets at 4)
let completedCycles = 0; // full work+break cycles (drives the progress bar)
let currentMode = "work";
let timerInterval = null;
let settingsOpen = false; // tracks whether the settings panel is visible
let previousDigits = "0000"; // last rendered digits, used to detect changes

//* ── Task state ─────────────────────────────────────────────────────────────
/* Each task: { id: number, text: string, completed: boolean } */
let tasks = loadTasks();

//* ── DOM refs ──────────────────────────────────────────────────────────────
const pomodoroBox = document.getElementById("pomodoroBox");
const playPauseBtn = document.getElementById("playPause");
const playPauseIcon = playPauseBtn.querySelector("span");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const modeTitle = document.getElementById("modeTitle");
const toast = document.getElementById("toast");
const progressFill = document.getElementById("progressFill");
const alarmSound = new Audio("./sounds/alarm.mp3");

alarmSound.volume = 0.7;

//* ── Display ───────────────────────────────────────────────────────────────

/* Pads a number to two digits: 5 → "05" */
const pad = (n) => String(n).padStart(2, "0");

/* Triggers the flip animation on a single digit element */
function flipDigit(digitEl, newValue) {
  const staticCard = digitEl.querySelector(".static");
  const flipCard = digitEl.querySelector(".flip-card");

  const staticTop = staticCard.querySelector(".top span");
  const staticBottom = staticCard.querySelector(".bottom span");
  const flipTop = flipCard.querySelector(".top span");
  const flipBottom = flipCard.querySelector(".bottom span");

  // Prepare flip card top with the outgoing value before animating
  flipTop.textContent = staticTop.textContent;
  flipBottom.textContent = staticTop.textContent; // bottom not visible during flipTop

  // Update static card immediately — it sits underneath the entire animation
  staticTop.textContent = newValue;
  staticBottom.textContent = newValue;

  // Remove and re-add the class to restart the animation if already running
  flipCard.classList.remove("flipping");
  void flipCard.offsetWidth; // forces the browser to re-render before re-adding

  flipCard.classList.add("flipping");

  // Remove flipping class once the animation ends
  flipCard.addEventListener(
    "animationend",
    () => {
      flipCard.classList.remove("flipping");
    },
    { once: true },
  );
}

/* Updates the display — animates only the digits that changed */
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const digits = pad(minutes) + pad(seconds);

  const digitEls = document.querySelectorAll(".digit");

  digits.split("").forEach((d, i) => {
    if (d !== previousDigits[i]) {
      flipDigit(digitEls[i], d);
    }
  });

  previousDigits = digits; // store for next comparison
}

/* Shows a message below the timer for a few seconds, then fades out */
const TOAST_DURATION_MS = 3000;
let toastTimeout = null;

function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.remove("toast-hide");
  toast.classList.add("toast-show");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
  }, TOAST_DURATION_MS);
}

/* Fills the progress bar proportionally to completedCycles */
function updateProgressBar() {
  const percent = (completedCycles / POMODOROS_BEFORE_LONG_BREAK) * 100;
  progressFill.style.width = `${percent}%`;
}

/* Syncs the play/pause button icon and colour class */
function updatePlayPauseBtn() {
  if (running) {
    playPauseIcon.textContent = "⏸";
    playPauseIcon.classList.remove("iconPlay");
    playPauseBtn.classList.add("pauseColor");
  } else {
    playPauseIcon.textContent = "▶";
    playPauseIcon.classList.add("iconPlay");
    playPauseBtn.classList.remove("pauseColor");
  }
}

//* ── Mode management ───────────────────────────────────────────────────────

/* Applies a mode: updates state, DOM classes, title, and the countdown */
function applyMode(modeName) {
  const mode = MODES[modeName];
  currentMode = modeName;
  timeLeft = mode.duration;
  modeTitle.textContent = mode.label;

  // Swap CSS class — remove all mode classes first, then add the new one
  Object.values(MODES).forEach(({ cssClass }) =>
    pomodoroBox.classList.remove(cssClass),
  );
  pomodoroBox.classList.add(mode.cssClass);

  // Reset previousDigits so all four digits animate on the first tick
  previousDigits = "----";
  updateDisplay();
}

/* Returns the next mode name and updates cycle/pomodoro counters */
function nextMode() {
  // A break just ended → one full cycle completed
  if (currentMode !== "work") {
    completedCycles++;
    updateProgressBar();
    return "work";
  }

  // A work block just ended → decide which break comes next
  pomodoroCount++;
  if (pomodoroCount >= POMODOROS_BEFORE_LONG_BREAK) {
    pomodoroCount = 0;
    return "longBreak";
  }
  return "shortBreak";
}

//* ── Timer ─────────────────────────────────────────────────────────────────

function startTimer() {
  if (running) return; // guard against duplicate intervals
  running = true;
  updatePlayPauseBtn();

  if (timeLeft === MODES[currentMode].duration) {
    showToast(MODES[currentMode].message);
  }

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      running = false;

      playAlarm();
      const incoming = nextMode();
      showToast(MODES[incoming].message);
      applyMode(incoming);
      startTimer();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  running = false;
  updatePlayPauseBtn();
}

/* Toggles between start and pause */
function toggleTimer() {
  running ? pauseTimer() : startTimer();
}

/* Stops the timer and returns to the initial work session */
function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  pomodoroCount = 0;
  completedCycles = 0;
  applyMode("work");
  updateProgressBar();
  updatePlayPauseBtn();
}

//* ── Settings ──────────────────────────────────────────────────────────────

/* Populates the input fields with the current config values */
function populateSettings() {
  document.getElementById("inputWork").value = MODES.work.duration / 60;
  document.getElementById("inputShortBreak").value =
    MODES.shortBreak.duration / 60;
  document.getElementById("inputLongBreak").value =
    MODES.longBreak.duration / 60;
  document.getElementById("inputPomodoros").value = POMODOROS_BEFORE_LONG_BREAK;
}

/* Opens or closes the settings panel */
function toggleSettings() {
  settingsOpen = !settingsOpen;
  settingsPanel.classList.toggle("settings-open", settingsOpen);
  if (settingsOpen) populateSettings();
}

/* Clamps a value between min and max to prevent invalid inputs */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/* Reads inputs, updates config, resets the timer */
function saveSettings() {
  MODES.work.duration =
    clamp(parseInt(document.getElementById("inputWork").value), 1, 60) * 60;
  MODES.shortBreak.duration =
    clamp(parseInt(document.getElementById("inputShortBreak").value), 1, 60) *
    60;
  MODES.longBreak.duration =
    clamp(parseInt(document.getElementById("inputLongBreak").value), 1, 60) *
    60;
  POMODOROS_BEFORE_LONG_BREAK = clamp(
    parseInt(document.getElementById("inputPomodoros").value),
    1,
    8,
  );

  toggleSettings();
  resetTimer();
}

//* ── Tasks ──────────────────────────────────────────────────────────────────

/* Reads tasks from localStorage. Returns empty array if nothing is saved yet. */
function loadTasks() {
  const saved = localStorage.getItem("tasks");
  return saved ? JSON.parse(saved) : [];
}

/* Writes the current tasks array to localStorage */
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* Rebuilds the task list in the DOM from the tasks array */
function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    const label = document.createElement("span");
    const delBtn = document.createElement("button");

    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    label.textContent = task.text;
    delBtn.textContent = "✕";
    delBtn.className = "task-delete";

    if (task.completed) li.classList.add("task-completed");

    checkbox.onclick = () => checkTask(task.id);
    delBtn.onclick = () => deleteTask(task.id);

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

/* Adds a new task from the input field */
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: Date.now(),
    text: text,
    completed: false,
  });

  taskInput.value = "";
  saveTasks();
  renderTasks();
}

/* Toggles the completed state of a task by id */
function checkTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

/* Removes a task by id */
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

//* ── Audio ─────────────────────────────────────────────────────────────────

function playAlarm() {
  alarmSound.currentTime = 0;
  alarmSound
    .play()
    .catch((err) => console.warn("Audio playback blocked:", err));
}

//* ── Init ───────────────────────────────────────────────────────────────────

playPauseBtn.onclick = toggleTimer;
document.getElementById("reset").onclick = resetTimer;
settingsBtn.onclick = toggleSettings;
document.getElementById("saveSettings").onclick = saveSettings;
document.getElementById("addTaskBtn").onclick = addTask;

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

applyMode("work"); // set initial state and render
updateProgressBar(); // render bar at 0%
renderTasks(); // render any tasks saved from a previous session

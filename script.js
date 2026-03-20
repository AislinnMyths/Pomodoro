//* ── Config ─────────────────────────────────────────────────────────────────
/* Single source of truth for durations and visual properties per mode.
   To add or tweak a mode, only edit this object. */
const MODES = {
  work: {
    duration: 10, // 1500 = 25 min
    label: "Pomodoro",
    cssClass: "workMode",
  },
  shortBreak: {
    duration: 5, // 300 = 5 min
    label: "Short break",
    cssClass: "shortBreakMode",
  },
  longBreak: {
    duration: 8, // 900 = 15 min
    label: "Long break",
    cssClass: "longBreakMode",
  },
};

const POMODOROS_BEFORE_LONG_BREAK = 4;

//* ── State ─────────────────────────────────────────────────────────────────
let timeLeft = MODES.work.duration;
let running = false;
let pomodoroCount = 0;
let currentMode = "work";
let timerInterval = null;

//* ── DOM refs ──────────────────────────────────────────────────────────────
const pomodoroBox = document.getElementById("pomodoroBox");
const playPauseBtn = document.getElementById("playPause");
const playPauseIcon = playPauseBtn.querySelector("span");
const modeTitle = document.createElement("p");
const alarmSound = new Audio("./sounds/alarm.mp3");

alarmSound.volume = 0.7;
pomodoroBox.appendChild(modeTitle);

//* ── Display ───────────────────────────────────────────────────────────────

/* Pads a number to two digits: 5 → "05" */
const pad = (n) => String(n).padStart(2, "0");

/* Writes all four digit slots from the current timeLeft */
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const digits = pad(minutes) + pad(seconds);

  const tops = document.querySelectorAll(".top span");
  const bottoms = document.querySelectorAll(".bottom span");

  digits.split("").forEach((d, i) => {
    tops[i].textContent = d;
    bottoms[i].textContent = d;
  });
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

  updateDisplay();
}

/* Returns the next mode name based on the Pomodoro cycle rules */
function nextMode() {
  if (currentMode !== "work") return "work";

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

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      running = false;

      playAlarm();
      applyMode(nextMode());
      startTimer(); // auto-start the next session
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
  applyMode("work");
  updatePlayPauseBtn();
}

//* ── Audio ─────────────────────────────────────────────────────────────────

function playAlarm() {
  alarmSound.currentTime = 0;
  alarmSound
    .play()
    .catch((err) => console.warn("Audio playback blocked:", err));
}

//*── Init─────────────────────────────────────────────────────────────

playPauseBtn.onclick = toggleTimer;
document.getElementById("reset").onclick = resetTimer;

applyMode("work"); // set initial state and render

/* --------------------------Global variables-------------------- */
const workDuration = 10; /* 1500 25 min */
const shortBreakDuration = 5; /* 300 5 min */
const longBreakDuration = 8; /* 900 15 min */

let timeLeft = workDuration; /* starts in 25:00 */
let running = false; /* timer stopped */
let pomodoroCounter = 0; /* cycles counter */
let currentMode = "work"; /* work, shortBreak, longBreak */

let timerInterval; /* will store the ID of setInterval */

/*------------------elements of the DOM-------------------------- */
const pomodoroBox = document.getElementById("pomodoroBox");
const modeTitle = document.createElement("p");
pomodoroBox.classList.add("workMode");//default
modeTitle.textContent = "Pomodoro"; //default
pomodoroBox.appendChild(modeTitle);
const playPauseBtn = document.getElementById("playPause");
const playPauseIcon = playPauseBtn.querySelector("span");
const alarmSound = new Audio("./sounds/alarm.mp3");
alarmSound.volume = 0.7; //default volume

/* --------------------------Functions-------------------------- */

/* Update the 4 digits of the timer in the DOM. */
function updateDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;

  // Format to two digits
  let minStr = minutes.toString().padStart(2, "0");
  let secStr = seconds.toString().padStart(2, "0");

  /* Split in 4 digits */
  let digits = minStr + secStr;

  /* Select the .digit elements and update their content. */
  const topDigitElements = document.querySelectorAll(".top span");
  const bottomDigitElements = document.querySelectorAll(".bottom span");

  for (let i = 0; i < 4; i++) {
    topDigitElements[i].textContent = digits[i];
    bottomDigitElements[i].textContent = digits[i];
  }
}

/* start the timer only if no other timer is running */
function startTimer() {
  if (running) return; /* avoid multiple simultaneous intervals */
  running = true;
  updatePlayPauseBtn();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    /* When the time reaches 0, the current cycle ends */
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      running = false;
      /* Only completed work blocks increase the counter */
      if (currentMode === "work") {
        pomodoroCounter++;
      }
      /* Automatically switch to the next mode */
      changeMode();

      updateDisplay();

      /* Automatically reset the timer for the new mode */
      startTimer();
    }
  }, 1000);
}

/* Visual change of the play/pause button based on its status */
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

/* Change mode according to the Pomodoro cycle and update visual */
function changeMode() {
  pomodoroBox.classList.remove("workMode", "shortBreakMode", "longBreakMode");
  if (currentMode === "work" && pomodoroCounter !== 0) {
    if (pomodoroCounter === 4) {
      pomodoroCounter = 0;
      currentMode = "longBreak";
      timeLeft = longBreakDuration;
      modeTitle.textContent = "Long break";
      pomodoroBox.classList.add("longBreakMode");
    } else {
      currentMode = "shortBreak";
      timeLeft = shortBreakDuration;
      modeTitle.textContent = "Short break";
      pomodoroBox.classList.add("shortBreakMode");
    }
  } else {
    currentMode = "work";
    timeLeft = workDuration;
    modeTitle.textContent = "Pomodoro";
    pomodoroBox.classList.add("workMode");
  }
  /* Refresh the display to show the new time */
  updateDisplay();

  // alarm when switching modes
  alarmSound.currentTime = 0;
  alarmSound.play().catch((err) => {
    console.warn("The sound couldn't be played:", err);
  });
}

/* Pause the timer */
function pauseTimer() {
  clearInterval(timerInterval);
  running = false;
  updatePlayPauseBtn();
}

/* switch between starting and pausing */
function toggleTimer() {
  (!running) ? startTimer() : pauseTimer();
}

/* reset everything to default values */
function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  timeLeft = workDuration;
  currentMode = "work";
  pomodoroCounter = 0;
  updateDisplay();
  updatePlayPauseBtn();
  changeMode();
}

/* ----------------------------Events-------------------------- */
document.getElementById("playPause").onclick = toggleTimer;
document.getElementById("reset").onclick = resetTimer;

updateDisplay();

/* --------------------------Global variables-------------------------- */
let workDuration = 1500; /* 25 min */
let shortBreakDuration = 300; /* 5 min */
let longBreakDuration = 900; /* 15 min */

let timeLeft = workDuration; /* starts in 25:00 */
let running = false; /* timer stopped */
let pomodoroCounter = 0; /* cycles counter */
let currentMode = "work"; /* work, shortBreak, longBreak */

let timerInterval; /* will store the ID of setInterval */

/* elements of the DOM */
const playPauseBtn = document.getElementById("playPause");
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
  const digitElements = document.querySelectorAll(".digit .card .top span");

  for (let i = 0; i < 4; i++) {
    digitElements[i].textContent = digits[i];
  }
}
/* start the timer only if no other timer is running */
function startTimer() {
  if (running) return; /* avoid multiple simultaneous intervals */
  running = true;

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
      /* Automatically reset the timer for the new mode */
      startTimer();

      updateDisplay();
    }
  }, 1000);
}

/* Pause the timer */
function pauseTimer() {
  clearInterval(timerInterval);
  running = false;
}

/* switch between starting and pausing */
function toggleTimer() {
  if (!running) {
    startTimer();
  } else {
    pauseTimer();
  }
}

/* reset everything to default values */
function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  timeLeft = workDuration;
  pomodoroCounter = 0;
  currentMode = "work";

  updateDisplay();
}

/* Change mode according to the Pomodoro cycle and update visual */
function changeMode() {
  if (currentMode === "work") {
    if (pomodoroCounter % 4 === 0) {
      currentMode = "longBreak";
      timeLeft = longBreakDuration;
    } else {
      currentMode = "shortBreak";
      timeLeft = shortBreakDuration;
    }
  } else if (currentMode === "shortBreak" || currentMode === "longBreak") {
    currentMode = "work";
    timeLeft = workDuration;
  }
  /* Refresh the display to show the new time */

  /* update the visual elements (colors/shadows) */
  const pomodoroBox = document.getElementById("pomodoroBox");
  if (currentMode === "work") {
    pomodoroBox.classList.add("workMode");
    pomodoroBox.classList.remove("breakMode");
  } else {
    pomodoroBox.classList.add("breakMode");
    pomodoroBox.classList.remove("workMode");
  }
}

/* Visual change of the play/pause button based on its status */
function updatePlayPauseBtn() {
  if (running) {
  } else {
  }
}

/* ----------------------------Events-------------------------- */
document.getElementById("playPause").onclick = toggleTimer;
document.getElementById("reset").onclick = resetTimer;


/* --------------------------Variables Globales-------------------------- */
let workDuration = 1500; // 25 minutos
let shortBreakDuration = 300; // 5 minutos
let longBreakDuration = 900; // 15 minutos

let timeLeft = workDuration; // empieza en 25:00
let running = false; // temporizador parado
let pomodoroCounter = 0; // contador de ciclos
let currentMode = "work"; // work, shortBreak, longBreak

let timerInterval; // guardará el ID del setInterval

/* elementos del DOM */
const playPauseBtn = document.getElementById("playPause");
/* --------------------------Funciones-------------------------- */
/* actualiza los 4 dígitos del timer en el DOM */
function updateDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;

  // Formatear a dos dígitos
  let minStr = minutes.toString().padStart(2, "0");
  let secStr = seconds.toString().padStart(2, "0");

  // Separar en 4 dígitos
  let digits = minStr + secStr;

  // Seleccionar los elementos .digit y actualizar su contenido
  const digitElements = document.querySelectorAll(".digit .card .top span");

  for (let i = 0; i < 4; i++) {
    digitElements[i].textContent = digits[i];
  }
}
/* inicia el temporizador solo si no hay otro corriendo */
function startTimer() {
   if (running) return; /* evita múltiples intervalos simultáneos*/
  running = true;

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    /* Cuando el tiempo llega a 0, termina el ciclo actual */
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      running = false;
      /* Solo los bloques de trabajo completados incrementan el contador */
      if(currentMode === "work"){
        pomodoroCounter++;
      }
      /* Cambiar automáticamente al siguiente modo */
      changeMode();
      /* Reinicia automáticamente el temporizador para el nuevo modo */
      startTimer();

      updateDisplay();
    }
  }, 1000);
}

/* Pausar el temporizador */
function pauseTimer() {
  clearInterval(timerInterval);
  running = false;
}

/* alterna entre iniciar y pausar */
function toggleTimer() {
  if (!running) {
    startTimer();
  } else {
    pauseTimer();
  }
}

/* resetea todo a valores iniciales */
function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  timeLeft = workDuration;
  pomodoroCounter = 0;
  currentMode = "work";

  updateDisplay();
}

/* Cambia el modo según el ciclo de Pomodoro y actualiza visual */
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
  /* Actualiza el display para reflejar el nuevo tiempo */
  updateDisplay();

  /* actualiza la parte visual (colores / sombras) */
  const pomodoroBox = document.getElementById("pomodoroBox");
  if (currentMode === "work") {
    pomodoroBox.classList.add("workMode");
    pomodoroBox.classList.remove("breakMode");
  } else {
    pomodoroBox.classList.add("breakMode");
    pomodoroBox.classList.remove("workMode");
  }
}

/* cambio visual del boton playPause segun estado */
function updatePlayPauseBtn() {
    if (running) {
        
    } else {
        
    }
}

/* ----------------------------Eventos-------------------------- */
document.getElementById("playPause").onclick = toggleTimer;
document.getElementById("reset").onclick = resetTimer;

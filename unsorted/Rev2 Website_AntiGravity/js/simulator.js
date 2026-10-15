/**
 * MicroLab Interactive ESP32 Industrial Testbench & REPL Simulator
 */

class ESP32Simulator {
  constructor() {
    this.distanceCm = 45;
    this.lightPct = 78;
    this.isPaused = false;
    this.heartbeatState = false;
    this.timerId = null;

    this.initElements();
    this.attachEventListeners();
    this.startTelemetryLoop();
  }

  initElements() {
    // Sliders
    this.sliderDistance = document.getElementById("tb-distance-slider");
    this.sliderLight = document.getElementById("tb-light-slider");

    // Display values
    this.valDistance = document.getElementById("tb-val-distance");
    this.valLight = document.getElementById("tb-val-light");
    this.valAdcRaw = document.getElementById("tb-val-adc-raw");

    // LEDs
    this.ledPower = document.getElementById("tb-led-power");
    this.ledHeartbeat = document.getElementById("tb-led-heartbeat");
    this.ledAlert = document.getElementById("tb-led-alert");
    this.ledNight = document.getElementById("tb-led-night");

    // Terminal
    this.terminalConsole = document.getElementById("tb-terminal-console");
    this.btnPause = document.getElementById("tb-btn-pause");
    this.btnClear = document.getElementById("tb-btn-clear");

    // Tabs
    this.tabHardware = document.getElementById("tb-tab-hardware");
    this.tabCode = document.getElementById("tb-tab-code");
    this.viewHardware = document.getElementById("tb-view-hardware");
    this.viewCode = document.getElementById("tb-view-code");
  }

  attachEventListeners() {
    if (this.sliderDistance) {
      this.sliderDistance.addEventListener("input", (e) => {
        this.distanceCm = parseFloat(e.target.value);
        if (this.valDistance) {
          this.valDistance.textContent = `${this.distanceCm} cm`;
        }
        this.evaluateThresholds(true);
      });
    }

    if (this.sliderLight) {
      this.sliderLight.addEventListener("input", (e) => {
        this.lightPct = parseInt(e.target.value, 10);
        const rawAdc = Math.round((this.lightPct / 100) * 4095);
        if (this.valLight) {
          this.valLight.textContent = `${this.lightPct}%`;
        }
        if (this.valAdcRaw) {
          this.valAdcRaw.textContent = `${rawAdc}`;
        }
        this.evaluateThresholds(true);
      });
    }

    if (this.btnPause) {
      this.btnPause.addEventListener("click", () => {
        this.isPaused = !this.isPaused;
        this.btnPause.textContent = this.isPaused ? "▶ Resume REPL" : "⏸ Pause REPL";
        this.logToConsole("SYS", `REPL Serial stream ${this.isPaused ? "PAUSED" : "RESUMED"}.`, "info");
      });
    }

    if (this.btnClear) {
      this.btnClear.addEventListener("click", () => {
        if (this.terminalConsole) {
          this.terminalConsole.innerHTML = "";
          this.logToConsole("SYS", "Console buffer cleared. Connected at 115200 baud.", "info");
        }
      });
    }

    // Tab switching
    if (this.tabHardware && this.tabCode) {
      this.tabHardware.addEventListener("click", () => {
        this.tabHardware.classList.add("active");
        this.tabCode.classList.remove("active");
        if (this.viewHardware) this.viewHardware.style.display = "flex";
        if (this.viewCode) this.viewCode.style.display = "none";
      });

      this.tabCode.addEventListener("click", () => {
        this.tabCode.classList.add("active");
        this.tabHardware.classList.remove("active");
        if (this.viewHardware) this.viewHardware.style.display = "none";
        if (this.viewCode) this.viewCode.style.display = "block";
      });
    }
  }

  evaluateThresholds(isManualInteraction = false) {
    // 1. Distance check (< 20cm triggers industrial alert)
    const isAlert = this.distanceCm < 20;
    if (this.ledAlert) {
      if (isAlert) {
        this.ledAlert.classList.add("active-red");
      } else {
        this.ledAlert.classList.remove("active-red");
      }
    }

    // 2. Light check (< 30% triggers night light D2)
    const isNight = this.lightPct < 30;
    if (this.ledNight) {
      if (isNight) {
        this.ledNight.classList.add("active-amber");
      } else {
        this.ledNight.classList.remove("active-amber");
      }
    }

    if (isManualInteraction && !this.isPaused) {
      if (isAlert) {
        this.logToConsole("RADAR", `PROXIMITY WARNING: ${this.distanceCm} cm (< 20 cm) -> D18 Relay tripped!`, "alert");
      }
      if (isNight) {
        this.logToConsole("ADC", `LOW AMBIENT LUX: ${this.lightPct}% -> D2 Aux Night Lighting engaged`, "sensor");
      }
    }
  }

  startTelemetryLoop() {
    this.logToConsole("BOOT", "MicroPython v1.22.0 on ESP32-WROOM-32 with XTENSA-LX6", "info");
    this.logToConsole("SYS", "Running industrial process supervisory loop on core 1...", "info");

    this.timerId = setInterval(() => {
      if (this.isPaused) return;

      // Heartbeat pulse toggle
      this.heartbeatState = !this.heartbeatState;
      if (this.ledHeartbeat) {
        if (this.heartbeatState) {
          this.ledHeartbeat.classList.add("active-green");
        } else {
          this.ledHeartbeat.classList.remove("active-green");
        }
      }

      // Read current state
      const rawAdc = Math.round((this.lightPct / 100) * 4095);
      const voltageMv = Math.round((rawAdc / 4095) * 3300);

      // Random minute jitter to simulate real electrical sensor noise
      const jitter = (Math.random() * 0.4 - 0.2);
      const reportedDist = Math.max(2, (this.distanceCm + jitter)).toFixed(1);

      if (this.distanceCm < 20) {
        this.logToConsole("RADAR", `[ALERT] Obstacle in safety envelope: ${reportedDist} cm (GPIO 18 HIGH)`, "alert");
      } else {
        this.logToConsole("RADAR", `Clearance: ${reportedDist} cm | Flight time: ${Math.round(reportedDist / 0.01715)} µs`, "sensor");
      }

      this.logToConsole("ADC", `Ch34: ${rawAdc} counts | ${voltageMv} mV (${this.lightPct}%)`, "info");

    }, 2400);
  }

  logToConsole(tag, message, typeClass = "info") {
    if (!this.terminalConsole) return;

    const line = document.createElement("div");
    line.className = "log-line";

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${Math.floor(now.getMilliseconds() / 100)}`;

    line.innerHTML = `
      <span class="log-time">[${timeStr}]</span>
      <span class="log-tag ${typeClass}">[${tag}]</span>
      <span class="log-msg">${escapeHtml(message)}</span>
    `;

    this.terminalConsole.appendChild(line);

    // Keep console capped to 60 lines
    while (this.terminalConsole.children.length > 60) {
      this.terminalConsole.removeChild(this.terminalConsole.firstChild);
    }

    this.terminalConsole.scrollTop = this.terminalConsole.scrollHeight;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

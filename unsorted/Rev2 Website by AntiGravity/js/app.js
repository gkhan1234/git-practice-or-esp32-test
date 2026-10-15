/**
 * The Micro Lab (themicrolab.org) - Main Application Controller
 * Handles project rendering, interactive ESP32 simulator, modals, search, and theme
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderProjects("all");
  renderSensors();
  renderTutorials();
  renderFaqs();
  initFilterTabs();
  initSimulator();
  initSearch();
  initProjectModal();
  initNewsletterAndContact();
});

/* ==========================================================================
   1. Theme Management (Dark / Light Mode)
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const storedTheme = localStorage.getItem("microlab-theme") || "dark";
  document.documentElement.setAttribute("data-theme", storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("microlab-theme", newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  if (!themeToggleBtn) return;
  if (theme === "light") {
    themeToggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>`;
    themeToggleBtn.setAttribute("aria-label", "Switch to Dark Mode");
  } else {
    themeToggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>`;
    themeToggleBtn.setAttribute("aria-label", "Switch to Light Mode");
  }
}

/* ==========================================================================
   2. Project Showcase & Filtering
   ========================================================================== */
function renderProjects(filterCategory = "all") {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  const filtered = filterCategory === "all"
    ? PROJECTS_DATA
    : PROJECTS_DATA.filter(p => p.category === filterCategory);

  grid.innerHTML = filtered.map(project => `
    <article class="project-card" data-id="${project.id}">
      <div class="card-top-bar">
        <div class="project-icon-badge">${project.icon}</div>
        <div class="card-badges">
          <span class="badge-tag amber">${project.categoryLabel}</span>
          <span class="badge-tag cyan">${project.difficulty}</span>
        </div>
      </div>

      <div class="card-meta-row">
        <span class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${project.duration}
        </span>
        <span class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
          ${project.microcontroller}
        </span>
      </div>

      <h3 class="project-card-title">${project.title}</h3>
      <p class="project-card-desc">${project.shortDescription}</p>

      <div class="project-card-footer">
        <button class="btn btn-primary btn-sm view-project-btn" data-id="${project.id}">
          <span>View Full Project</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button class="btn btn-outline btn-sm quick-copy-btn" data-id="${project.id}" title="Copy MicroPython code">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Code</span>
        </button>
      </div>
    </article>
  `).join("");

  // Attach button click handlers
  grid.querySelectorAll(".view-project-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openProjectModal(btn.getAttribute("data-id"));
    });
  });

  grid.querySelectorAll(".quick-copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const proj = PROJECTS_DATA.find(p => p.id === btn.getAttribute("data-id"));
      if (proj) {
        navigator.clipboard.writeText(proj.micropythonCode);
        showToast("MicroPython code copied to clipboard!");
      }
    });
  });
}

function initFilterTabs() {
  const tabs = document.querySelectorAll(".filter-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const category = tab.getAttribute("data-category");
      renderProjects(category);
    });
  });
}

/* ==========================================================================
   3. Sensor & Hardware Guide (STEM Lab)
   ========================================================================== */
function renderSensors() {
  const grid = document.getElementById("sensors-grid");
  if (!grid) return;

  grid.innerHTML = SENSORS_DATA.map(sensor => `
    <div class="sensor-card">
      <div class="sensor-type-pill">${sensor.type}</div>
      <h3 class="sensor-name">${sensor.name}</h3>
      <p class="sensor-desc">${sensor.description}</p>
      
      <div class="sensor-specs-list">
        <div class="sensor-spec-row">
          <span class="spec-key">Operating Voltage:</span>
          <span class="spec-val">${sensor.voltage}</span>
        </div>
        <div class="sensor-spec-row">
          <span class="spec-key">Protocol / Interface:</span>
          <span class="spec-val">${sensor.protocol}</span>
        </div>
        <div class="sensor-spec-row">
          <span class="spec-key">Pin Configuration:</span>
          <span class="spec-val">${sensor.pinCount}</span>
        </div>
      </div>

      <div class="sensor-features-tags">
        ${sensor.features.map(f => `<span class="feature-tag">✓ ${f}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

/* ==========================================================================
   4. Tutorials & Guides Rendering
   ========================================================================== */
function renderTutorials() {
  const grid = document.getElementById("tutorials-grid");
  if (!grid) return;

  grid.innerHTML = TUTORIALS_DATA.map(tut => `
    <article class="tutorial-card">
      <div class="tutorial-meta">
        <span class="tutorial-tag">${tut.tag}</span>
        <span>•</span>
        <span>${tut.readTime}</span>
      </div>
      <h3 class="tutorial-title">${tut.title}</h3>
      <p class="tutorial-summary">${tut.summary}</p>
      <div class="tutorial-footer">
        <span style="color: var(--text-muted);">By ${tut.author} (${tut.date})</span>
        <button class="btn btn-outline btn-sm read-guide-btn" data-title="${tut.title}">
          <span>Read Guide</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".read-guide-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showToast(`Opening Guide: "${btn.getAttribute("data-title")}"`);
    });
  });
}

/* ==========================================================================
   5. Interactive FAQs Accordion
   ========================================================================== */
function renderFaqs() {
  const container = document.getElementById("faq-container");
  if (!container) return;

  container.innerHTML = FAQS_DATA.map((faq, idx) => `
    <div class="faq-item ${idx === 0 ? 'active' : ''}">
      <button class="faq-question" aria-expanded="${idx === 0}">
        <span>${faq.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <p>${faq.a}</p>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const wasActive = item.classList.contains("active");

      // Accordion mode: close others
      container.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("active");
        i.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });

      if (!wasActive) {
        item.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ==========================================================================
   6. Interactive ESP32 Simulator Logic
   ========================================================================== */
function initSimulator() {
  const distanceSlider = document.getElementById("sim-distance-slider");
  const distanceValDisplay = document.getElementById("sim-dist-val");
  const ldrSlider = document.getElementById("sim-ldr-slider");
  const ldrValDisplay = document.getElementById("sim-ldr-val");
  const terminal = document.getElementById("sim-terminal");
  const redLed = document.getElementById("sim-led-red");
  const greenLed = document.getElementById("sim-led-green");
  const blueLed = document.getElementById("sim-led-blue");
  const simTabs = document.querySelectorAll(".sim-tab-btn");
  const circuitPane = document.getElementById("sim-circuit-pane");
  const codePane = document.getElementById("sim-code-pane");
  const runToggleBtn = document.getElementById("sim-run-toggle");

  let isRunning = true;
  let chaserStep = 0;
  let chaserInterval = null;

  function logTerminal(message, type = "normal") {
    if (!terminal) return;
    const time = new Date().toTimeString().split(" ")[0];
    const line = document.createElement("div");
    line.className = "terminal-line";
    line.innerHTML = `<span class="timestamp">[${time}]</span> <span class="${type}">${message}</span>`;
    terminal.prepend(line);
    // Keep max 25 lines
    if (terminal.children.length > 25) {
      terminal.removeChild(terminal.lastChild);
    }
  }

  // Ultrasonic Distance Slider Interaction
  if (distanceSlider && distanceValDisplay) {
    distanceSlider.addEventListener("input", (e) => {
      const dist = parseInt(e.target.value, 10);
      distanceValDisplay.textContent = `${dist} cm`;

      if (dist < 20) {
        redLed.classList.add("active");
        logTerminal(`[WARNING] Obstacle detected! Distance: ${dist}cm (<20cm threshold)`, "alert");
      } else {
        redLed.classList.remove("active");
        logTerminal(`HC-SR04 ping echo: ${dist}cm ok`, "success");
      }
    });
  }

  // LDR Light Sensor Interaction
  if (ldrSlider && ldrValDisplay) {
    ldrSlider.addEventListener("input", (e) => {
      const percent = parseInt(e.target.value, 10);
      const rawAdc = Math.round((percent / 100) * 4095);
      ldrValDisplay.textContent = `${percent}% (${rawAdc} ADC)`;

      if (percent < 30) {
        blueLed.classList.add("active");
        logTerminal(`LDR raw ADC: ${rawAdc} | Night Mode Triggered! GPIO 2 LED ON`, "warning");
      } else {
        blueLed.classList.remove("active");
        logTerminal(`LDR raw ADC: ${rawAdc} | Daylight normal. GPIO 2 LED OFF`, "normal");
      }
    });
  }

  // LED Pattern Runner
  function startChaser() {
    chaserInterval = setInterval(() => {
      if (!isRunning) return;
      // Cycle green LED pulse
      greenLed.classList.toggle("active");
    }, 600);
  }

  startChaser();

  // Run/Pause Button
  if (runToggleBtn) {
    runToggleBtn.addEventListener("click", () => {
      isRunning = !isRunning;
      runToggleBtn.innerHTML = isRunning 
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> <span>Pause</span>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> <span>Run</span>`;
      logTerminal(isRunning ? "Simulation resumed." : "Simulation paused.", "warning");
    });
  }

  // Simulator Tab Switching
  simTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      simTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      if (target === "circuit") {
        circuitPane.style.display = "block";
        codePane.classList.remove("active");
      } else {
        circuitPane.style.display = "none";
        codePane.classList.add("active");
      }
    });
  });

  // Initial welcome log
  logTerminal("The Micro Lab ESP32 Virtual REPL v1.2.0 (MicroPython)", "success");
  logTerminal("Sensors connected: HC-SR04 (GPIO 5/18), LDR (GPIO 34), LEDs (GPIO 2,18,19)", "normal");
}

/* ==========================================================================
   7. Project Detail Modal Dialog
   ========================================================================== */
function initProjectModal() {
  const overlay = document.getElementById("project-modal-overlay");
  const closeBtn = document.getElementById("modal-close-btn");
  const modalTabs = document.querySelectorAll(".modal-tab-btn");

  if (!overlay) return;

  function closeModal() {
    overlay.classList.remove("open");
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      closeModal();
    }
  });

  modalTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      modalTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const targetPaneId = tab.getAttribute("data-pane");

      document.querySelectorAll(".modal-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const activePane = document.getElementById(targetPaneId);
      if (activePane) activePane.classList.add("active");
    });
  });
}

function openProjectModal(projectId) {
  const project = PROJECTS_DATA.find(p => p.id === projectId);
  if (!project) return;

  const overlay = document.getElementById("project-modal-overlay");
  const titleEl = document.getElementById("modal-project-title");
  const descEl = document.getElementById("modal-overview-desc");
  const pinTableEl = document.getElementById("modal-pinout-body");
  const bomContainerEl = document.getElementById("modal-bom-grid");
  const pyCodeEl = document.getElementById("modal-py-code");
  const cCodeEl = document.getElementById("modal-c-code");

  if (titleEl) titleEl.innerHTML = `<span>${project.icon}</span> <span>${project.title}</span>`;
  if (descEl) descEl.textContent = project.fullDescription;

  // Render Pinout Table
  if (pinTableEl) {
    pinTableEl.innerHTML = project.pinConnections.map(pin => `
      <tr>
        <td><strong>${pin.component}</strong></td>
        <td><code>${pin.esp32Pin}</code></td>
        <td>${pin.resistor}</td>
      </tr>
    `).join("");
  }

  // Render Hardware BOM
  if (bomContainerEl) {
    bomContainerEl.innerHTML = project.hardware.map(item => `
      <div class="bom-item">
        <div class="bom-info">
          <span class="bom-name">${item.name}</span>
          <span class="bom-note">${item.note}</span>
        </div>
        <span class="bom-qty">${item.qty}</span>
      </div>
    `).join("");
  }

  // Code Content
  if (pyCodeEl) pyCodeEl.textContent = project.micropythonCode;
  if (cCodeEl) cCodeEl.textContent = project.arduinoCode;

  // Set up Copy Buttons inside modal
  const copyPyBtn = document.getElementById("copy-py-btn");
  if (copyPyBtn) {
    copyPyBtn.onclick = () => {
      navigator.clipboard.writeText(project.micropythonCode);
      showToast("MicroPython code copied!");
    };
  }

  const copyCBtn = document.getElementById("copy-c-btn");
  if (copyCBtn) {
    copyCBtn.onclick = () => {
      navigator.clipboard.writeText(project.arduinoCode);
      showToast("Arduino C++ code copied!");
    };
  }

  // Download buttons
  const downloadPyBtn = document.getElementById("download-py-btn");
  if (downloadPyBtn) {
    downloadPyBtn.onclick = () => downloadFile(`${project.id}.py`, project.micropythonCode);
  }

  const downloadCBtn = document.getElementById("download-c-btn");
  if (downloadCBtn) {
    downloadCBtn.onclick = () => downloadFile(`${project.id}.ino`, project.arduinoCode);
  }

  // Reset to first tab
  document.querySelectorAll(".modal-tab-btn").forEach((t, i) => {
    t.classList.toggle("active", i === 0);
  });
  document.querySelectorAll(".modal-pane").forEach((p, i) => {
    p.classList.toggle("active", i === 0);
  });

  overlay.classList.add("open");
}

function downloadFile(filename, text) {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  showToast(`Downloaded ${filename}`);
}

/* ==========================================================================
   8. Global Quick Search (Ctrl+K / Cmd+K)
   ========================================================================== */
function initSearch() {
  const triggerBtn = document.getElementById("global-search-trigger");
  const modal = document.getElementById("search-modal");
  const input = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");

  if (!modal || !input) return;

  function openSearch() {
    modal.classList.add("open");
    input.value = "";
    input.focus();
    renderSearchResults("");
  }

  function closeSearch() {
    modal.classList.remove("open");
  }

  if (triggerBtn) triggerBtn.addEventListener("click", openSearch);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSearch();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      modal.classList.contains("open") ? closeSearch() : openSearch();
    }
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeSearch();
    }
  });

  input.addEventListener("input", (e) => {
    renderSearchResults(e.target.value.trim().toLowerCase());
  });

  function renderSearchResults(query) {
    if (!resultsContainer) return;

    const matchedProjects = PROJECTS_DATA.filter(p => 
      !query || p.title.toLowerCase().includes(query) || p.shortDescription.toLowerCase().includes(query) || p.microcontroller.toLowerCase().includes(query)
    );

    const matchedSensors = SENSORS_DATA.filter(s =>
      !query || s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );

    let html = "";

    if (matchedProjects.length > 0) {
      html += `<div style="padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Projects</div>`;
      html += matchedProjects.map(p => `
        <div class="search-result-item" data-action="project" data-id="${p.id}">
          <span class="result-icon">${p.icon}</span>
          <div class="result-text">
            <span class="result-title">${p.title}</span>
            <span class="result-category">${p.categoryLabel} • ${p.difficulty}</span>
          </div>
        </div>
      `).join("");
    }

    if (matchedSensors.length > 0) {
      html += `<div style="padding: 0.5rem 0.75rem 0.35rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Sensors & Hardware</div>`;
      html += matchedSensors.map(s => `
        <div class="search-result-item" data-action="sensor" data-id="${s.id}">
          <span class="result-icon">⚡</span>
          <div class="result-text">
            <span class="result-title">${s.name}</span>
            <span class="result-category">${s.type}</span>
          </div>
        </div>
      `).join("");
    }

    if (!html) {
      html = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No matching projects or sensors found.</div>`;
    }

    resultsContainer.innerHTML = html;

    resultsContainer.querySelectorAll(".search-result-item").forEach(item => {
      item.addEventListener("click", () => {
        closeSearch();
        const action = item.getAttribute("data-action");
        const id = item.getAttribute("data-id");
        if (action === "project") {
          openProjectModal(id);
        } else if (action === "sensor") {
          const section = document.getElementById("sensors-section");
          if (section) section.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }
}

/* ==========================================================================
   9. Newsletter & Contact Form Feedback
   ========================================================================== */
function initNewsletterAndContact() {
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector("input[type='email']");
      if (emailInput && emailInput.value) {
        showToast(`🎉 Thanks for joining! We've sent a welcome kit to ${emailInput.value}`);
        emailInput.value = "";
      }
    });
  }

  // Mobile menu toggle
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      const isVisible = navLinks.style.display === "flex";
      navLinks.style.display = isVisible ? "none" : "flex";
      if (!isVisible) {
        navLinks.style.flexDirection = "column";
        navLinks.style.position = "absolute";
        navLinks.style.top = "4.5rem";
        navLinks.style.left = "0";
        navLinks.style.width = "100%";
        navLinks.style.background = "var(--bg-secondary)";
        navLinks.style.padding = "1.5rem";
        navLinks.style.borderBottom = "1px solid var(--border-color)";
      }
    });
  }
}

/* ==========================================================================
   10. Toast Notification Helper
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #111827;
      color: #F3F4F6;
      border: 1px solid var(--accent-amber);
      box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(255,159,0,0.3);
      padding: 0.85rem 1.35rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  toast.style.transform = "translateY(0)";
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.transform = "translateY(100px)";
    toast.style.opacity = "0";
  }, 3500);
}

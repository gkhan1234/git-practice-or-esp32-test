/**
 * MicroLab Main Application Logic
 * Router, Project Modals, Blog & Student Q&A with Instructor Curation,
 * Theme Management, and Omnibox Search.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Ensure all dialogs start closed
  if (typeof window.closeAllModals === "function") {
    window.closeAllModals();
  }

  // Initialize App State
  initTheme();
  initRouting();
  renderIndustries();
  renderProjects();
  renderBlog();
  initFaqAccordion();
  initSearchOmnibox();
  initContactForm();
  initCurationSystem();

  // Initialize ESP32 Testbench Simulator
  window.microLabSimulator = new ESP32Simulator();
});

/* ===================================================
   1. Theme Management (Cyber Dark / Engineering Light)
   =================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem("microlab_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const nextTheme = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("microlab_theme", nextTheme);
      showToast(`Switched to ${nextTheme === "dark" ? "Cyber Dark" : "Clean Light"} mode`);
    });
  }
}

/* ===================================================
   2. Fluid SPA Hash Router
   =================================================== */
function initRouting() {
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const mobileToggle = document.getElementById("mobile-menu-btn");
  const mobileClose = document.getElementById("mobile-drawer-close");

  function handleRoute() {
    let hash = window.location.hash || "#home";
    // Sanitize hash to match view IDs
    const validViews = ["#home", "#parents", "#schools", "#projects", "#testbench", "#blog", "#about", "#contact"];
    if (!validViews.includes(hash)) {
      hash = "#home";
    }

    const viewId = hash.replace("#", "") + "-view";
    const targetView = document.getElementById(viewId);

    // Close any open modal dialogs on route navigation
    document.querySelectorAll("dialog[open]").forEach(dialog => dialog.close());

    // Hide all views, show target
    document.querySelectorAll(".page-view").forEach(v => v.classList.remove("active-view"));
    if (targetView) {
      targetView.classList.add("active-view");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update active nav links
    navLinks.forEach(link => {
      if (link.getAttribute("href") === hash) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Close mobile drawer if open
    if (mobileDrawer) {
      mobileDrawer.classList.remove("open");
    }
  }

  window.addEventListener("hashchange", handleRoute);
  handleRoute(); // Run initial route

  // Mobile menu open/close
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", () => mobileDrawer.classList.add("open"));
  }
  if (mobileClose && mobileDrawer) {
    mobileClose.addEventListener("click", () => mobileDrawer.classList.remove("open"));
  }
  if (mobileDrawer) {
    mobileDrawer.addEventListener("click", (e) => {
      if (e.target === mobileDrawer) mobileDrawer.classList.remove("open");
    });
  }
}

/* ===================================================
   3. Render 10 Embedded Industries Grid
   =================================================== */
function renderIndustries() {
  const container = document.getElementById("industries-grid");
  if (!container) return;

  container.innerHTML = MICROLAB_DATA.industries.map(ind => `
    <div class="industry-card">
      <div class="industry-header">
        <div class="industry-icon">${ind.icon}</div>
        <div class="industry-name">${ind.name}</div>
      </div>
      <div class="industry-examples">${ind.components}</div>
    </div>
  `).join("");
}

/* ===================================================
   4. Render Projects & Interactive Detail Modal
   =================================================== */
function renderProjects(filterCategory = "all") {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  const filtered = filterCategory === "all"
    ? MICROLAB_DATA.projects
    : MICROLAB_DATA.projects.filter(p => p.category === filterCategory);

  grid.innerHTML = filtered.map(p => `
    <div class="project-card" data-id="${p.id}">
      <div class="project-card-image">
        <div class="project-industry-badge">${p.industryTag}</div>
        <div class="project-meta-pills">
          <span class="meta-chip">${p.difficulty}</span>
          <span class="meta-chip">${p.timeEst}</span>
        </div>
        <div style="font-size: 3.5rem; opacity: 0.85;">
          ${getProjectGraphicIcon(p.id)}
        </div>
      </div>
      <div class="project-card-body">
        <h3 class="project-title">${p.title}</h3>
        <div class="project-consequence-formula">
          ⚡ ${p.consequenceFormula}
        </div>
        <p class="project-description">${p.shortDesc}</p>
        <div class="project-card-footer">
          <button class="btn btn-primary btn-sm open-project-btn" data-id="${p.id}">
            View Full Project
          </button>
          <button class="btn btn-secondary btn-sm copy-quick-code-btn" data-id="${p.id}">
            Copy .py Code
          </button>
        </div>
      </div>
    </div>
  `).join("");

  // Attach card button listeners
  grid.querySelectorAll(".open-project-btn").forEach(btn => {
    btn.addEventListener("click", () => openProjectModal(btn.dataset.id));
  });

  grid.querySelectorAll(".copy-quick-code-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const proj = MICROLAB_DATA.projects.find(p => p.id === btn.dataset.id);
      if (proj) {
        navigator.clipboard.writeText(proj.micropythonCode);
        showToast(`Copied ${proj.title} MicroPython code!`);
      }
    });
  });

  // Filter Pills
  const filterPills = document.querySelectorAll(".filter-pill");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      renderProjects(pill.dataset.category);
    });
  });
}

function getProjectGraphicIcon(id) {
  const iconMap = {
    "relay-control": "⚡🔌",
    "analog-sensing": "💡📊",
    "ultrasonic-distance": "📡📏",
    "environmental-monitor": "🌡️🌱",
    "imu-motion": "🧭✈️",
    "servo-actuation": "🤖⚙️"
  };
  return iconMap[id] || "🔧🔬";
}

/* ===================================================
   5. Project Detail Modal Dialog
   =================================================== */
function openProjectModal(projectId) {
  const project = MICROLAB_DATA.projects.find(p => p.id === projectId);
  if (!project) return;

  const modal = document.getElementById("project-modal");
  if (!modal) return;

  // Populate Title & Formula
  document.getElementById("modal-project-title").textContent = project.title;
  document.getElementById("modal-project-tag").textContent = project.industryTag;
  document.getElementById("modal-project-formula").textContent = `Consequence: ${project.consequenceFormula}`;

  // Populate Overview Tab
  document.getElementById("modal-project-overview").innerHTML = `
    <p style="font-size: 1.05rem; line-height: 1.7; margin-bottom: 1.25rem;">${project.longDesc}</p>
    <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
      <h4 style="color: var(--accent-amber); margin-bottom: 0.35rem;">Industrial Parallel</h4>
      <p style="font-size: 0.95rem; color: var(--text-secondary);">${project.mfgApplication}</p>
    </div>
  `;

  // Populate Pinout Wiring Table
  const pinoutTableBody = document.getElementById("modal-pinout-body");
  pinoutTableBody.innerHTML = project.pinoutTable.map(row => `
    <tr>
      <td><strong>${row.compPin}</strong></td>
      <td><span class="pin-chip">${row.espPin}</span></td>
      <td style="color: var(--text-secondary);">${row.note}</td>
    </tr>
  `).join("");

  // Populate Code Blocks
  document.getElementById("modal-code-py").textContent = project.micropythonCode;
  document.getElementById("modal-code-ino").textContent = project.arduinoCode;

  // Populate BOM
  const bomBody = document.getElementById("modal-bom-body");
  bomBody.innerHTML = project.bom.map(item => `
    <tr>
      <td><strong>${item.item}</strong></td>
      <td><span class="pin-chip">${item.qty}</span></td>
      <td style="color: var(--text-secondary);">${item.note}</td>
    </tr>
  `).join("");

  // Modal Code Copy & Download buttons
  document.getElementById("btn-copy-modal-py").onclick = () => {
    navigator.clipboard.writeText(project.micropythonCode);
    showToast("MicroPython code copied to clipboard!");
  };

  document.getElementById("btn-download-modal-py").onclick = () => {
    downloadFile(`${project.id}_main.py`, project.micropythonCode);
  };

  document.getElementById("btn-copy-modal-ino").onclick = () => {
    navigator.clipboard.writeText(project.arduinoCode);
    showToast("Arduino C++ sketch copied to clipboard!");
  };

  document.getElementById("btn-download-modal-ino").onclick = () => {
    downloadFile(`${project.id}.ino`, project.arduinoCode);
  };

  // Reset tab to Overview
  switchModalTab("overview");

  // Close any other open modal before showing
  window.closeAllModals();

  // Show modal
  modal.showModal();
}

function switchModalTab(tabName) {
  document.querySelectorAll(".modal-tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tabName);
  });
  document.querySelectorAll(".modal-tab-content").forEach(c => {
    c.style.display = c.dataset.tab === tabName ? "block" : "none";
  });
}

// Global function to close any open dialog safely
window.closeAllModals = function() {
  document.querySelectorAll("dialog").forEach(d => {
    try {
      d.close();
    } catch (err) {}
    d.removeAttribute("open");
  });
};

// Modal tab click & close listeners
document.addEventListener("click", (e) => {
  if (e.target.matches(".modal-tab-btn")) {
    switchModalTab(e.target.dataset.tab);
  }
  if (e.target.closest("#project-modal-close") ||
      e.target.closest("#blog-modal-close") ||
      e.target.closest("#post-new-modal-close") ||
      e.target.closest("#post-new-modal-cancel") ||
      e.target.closest("#search-modal-close") ||
      e.target.closest(".modal-close-btn")) {
    window.closeAllModals();
  }
});

// Escape key closes any active modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeAllModals();
  }
});

// Light Dismiss: Click backdrop outside modal content to close
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= e.clientY && e.clientY <= rect.bottom &&
        rect.left <= e.clientX && e.clientX <= rect.right
      );
      if (!isInside) {
        window.closeAllModals();
      }
    }
  });
});

/* Helper to download source text as a file */
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`);
}

/* ===================================================
   6. Dynamic Project Blog & Student Q&A with Curation
   =================================================== */
function getStoredBlogPosts() {
  const stored = localStorage.getItem("microlab_blog_posts");
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return MICROLAB_DATA.blogPosts;
}

function saveBlogPosts(posts) {
  localStorage.setItem("microlab_blog_posts", JSON.stringify(posts));
}

function renderBlog() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  const posts = getStoredBlogPosts();

  grid.innerHTML = posts.map(post => {
    const commentsCount = (post.comments || []).length;
    return `
      <div class="blog-card" data-post-id="${post.id}">
        <div class="blog-card-meta">
          <span>${post.date}</span>
          <span>${post.readTime}</span>
        </div>
        <div class="blog-card-body">
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber); text-transform: uppercase; font-weight: 700; margin-bottom: 0.4rem;">
            ${post.industryTag}
          </span>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-footer">
            <button class="btn btn-secondary btn-sm read-blog-btn" data-post-id="${post.id}">
              Read Guide & Discussion
            </button>
            <span class="qa-count-chip">
              💬 ${commentsCount} Q&A
            </span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".read-blog-btn").forEach(btn => {
    btn.addEventListener("click", () => openBlogModal(btn.dataset.postId));
  });
}

function openBlogModal(postId) {
  const posts = getStoredBlogPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const modal = document.getElementById("blog-modal");
  if (!modal) return;

  // Set current active post id on modal
  modal.dataset.currentPostId = postId;

  document.getElementById("modal-blog-title").textContent = post.title;
  document.getElementById("modal-blog-meta").textContent = `${post.date} · By ${post.author} (${post.authorRole}) · ${post.readTime}`;
  document.getElementById("modal-blog-content").innerHTML = post.content;

  renderCommentsSection(post);

  // Close any other open modal before showing
  window.closeAllModals();

  modal.showModal();
}

function renderCommentsSection(post) {
  const commentList = document.getElementById("modal-comment-list");
  if (!commentList) return;

  const isCuratorMode = document.body.classList.contains("curator-mode-active");

  const comments = (post.comments || []).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (comments.length === 0) {
    commentList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No student questions yet. Be the first to ask below!</p>`;
    return;
  }

  commentList.innerHTML = comments.map(c => `
    <div class="comment-card ${c.pinned ? 'pinned' : ''}" data-comment-id="${c.id}">
      <div class="comment-top">
        <div class="comment-author-group">
          <span class="comment-author-name">${escapeHtml(c.author)}</span>
          <span class="student-tag">${escapeHtml(c.role || 'Student')}</span>
          ${c.pinned ? '<span style="color: var(--accent-amber); font-size: 0.75rem; font-weight: 700;">📌 Pinned</span>' : ''}
        </div>
        <span class="comment-date">${c.date}</span>
      </div>
      <div class="comment-content">${escapeHtml(c.text)}</div>

      ${c.instructorReply ? `
        <div class="instructor-reply-box">
          <div class="reply-header">
            <span class="instructor-badge">Verified Instructor</span>
            <span class="instructor-name">${escapeHtml(c.instructorReply.author)} (${escapeHtml(c.instructorReply.role)})</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">${c.instructorReply.date}</span>
          </div>
          <div class="reply-text">${escapeHtml(c.instructorReply.text)}</div>
        </div>
      ` : ''}

      <div class="curator-actions">
        <button class="curator-btn curator-pin-btn" data-comment-id="${c.id}">
          ${c.pinned ? 'Unpin' : 'Pin to Top'}
        </button>
        <button class="curator-btn curator-reply-btn" data-comment-id="${c.id}">
          ${c.instructorReply ? 'Edit Reply' : 'Add Instructor Reply'}
        </button>
        <button class="curator-btn danger curator-delete-btn" data-comment-id="${c.id}">
          Delete
        </button>
      </div>
    </div>
  `).join("");

  attachCommentCuratorListeners(post.id);
}

function attachCommentCuratorListeners(postId) {
  const commentList = document.getElementById("modal-comment-list");
  if (!commentList) return;

  // Pin / Unpin
  commentList.querySelectorAll(".curator-pin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const commentId = btn.dataset.commentId;
      const posts = getStoredBlogPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
        const comment = post.comments.find(c => c.id === commentId);
        if (comment) {
          comment.pinned = !comment.pinned;
          saveBlogPosts(posts);
          renderCommentsSection(post);
          renderBlog();
          showToast(comment.pinned ? "Comment pinned to top" : "Comment unpinned");
        }
      }
    });
  });

  // Add / Edit Reply
  commentList.querySelectorAll(".curator-reply-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const commentId = btn.dataset.commentId;
      const reply = prompt("Enter official Instructor Reply (from Gary Khan):");
      if (reply && reply.trim()) {
        const posts = getStoredBlogPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
          const comment = post.comments.find(c => c.id === commentId);
          if (comment) {
            comment.instructorReply = {
              author: "Gary Khan",
              role: "Founder & Lead Engineer",
              date: "Just now",
              text: reply.trim()
            };
            saveBlogPosts(posts);
            renderCommentsSection(post);
            showToast("Instructor reply published!");
          }
        }
      }
    });
  });

  // Delete Comment
  commentList.querySelectorAll(".curator-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Are you sure you want to remove this student question?")) {
        const commentId = btn.dataset.commentId;
        const posts = getStoredBlogPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
          post.comments = post.comments.filter(c => c.id !== commentId);
          saveBlogPosts(posts);
          renderCommentsSection(post);
          renderBlog();
          showToast("Comment deleted.");
        }
      }
    });
  });
}

// Student Question Submission Form Handler
function initCurationSystem() {
  const commentForm = document.getElementById("student-comment-form");
  if (commentForm) {
    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const modal = document.getElementById("blog-modal");
      const postId = modal ? modal.dataset.currentPostId : null;
      if (!postId) return;

      const nameInput = document.getElementById("comment-name");
      const roleSelect = document.getElementById("comment-role");
      const textInput = document.getElementById("comment-text");

      const name = nameInput.value.trim();
      const role = roleSelect.value;
      const text = textInput.value.trim();

      if (!name || !text) {
        alert("Please fill in your name and question.");
        return;
      }

      const newComment = {
        id: "c_" + Date.now(),
        author: name,
        role: role,
        date: "Just now",
        text: text,
        status: "approved",
        pinned: false,
        instructorReply: null
      };

      const posts = getStoredBlogPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.comments = post.comments || [];
        post.comments.push(newComment);
        saveBlogPosts(posts);
        renderCommentsSection(post);
        renderBlog();

        commentForm.reset();
        showToast("Your question has been posted to the lab discussion!");
      }
    });
  }

  // Instructor Curation Mode Toggle Switch
  const toggleSwitch = document.getElementById("curator-toggle-switch");
  if (toggleSwitch) {
    toggleSwitch.addEventListener("click", () => {
      const isActive = toggleSwitch.classList.toggle("active");
      document.body.classList.toggle("curator-mode-active", isActive);

      const statusLabel = document.getElementById("curator-status-text");
      if (statusLabel) {
        statusLabel.textContent = isActive ? "Instructor Curation Mode (ACTIVE)" : "Instructor Curation Mode (OFF)";
        statusLabel.style.color = isActive ? "var(--accent-amber)" : "var(--text-secondary)";
      }

      // Re-render open modal's comments if open
      const modal = document.getElementById("blog-modal");
      if (modal && modal.open) {
        const postId = modal.dataset.currentPostId;
        const posts = getStoredBlogPosts();
        const post = posts.find(p => p.id === postId);
        if (post) renderCommentsSection(post);
      }

      showToast(isActive ? "Curation mode enabled: You can pin, reply, or delete entries." : "Curation mode disabled.");
    });
  }

  // Post New Project Update Button & Modal
  const postNewBtn = document.getElementById("btn-post-new-project");
  const postNewModal = document.getElementById("post-new-modal");
  const postNewForm = document.getElementById("new-project-post-form");

  if (postNewBtn && postNewModal) {
    postNewBtn.addEventListener("click", () => {
      window.closeAllModals();
      postNewModal.showModal();
    });
  }

  if (postNewForm && postNewModal) {
    postNewForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = document.getElementById("new-post-title").value.trim();
      const tag = document.getElementById("new-post-tag").value.trim();
      const excerpt = document.getElementById("new-post-excerpt").value.trim();
      const content = document.getElementById("new-post-content").value.trim();

      if (!title || !content) {
        alert("Please provide at least a title and technical content.");
        return;
      }

      const newPost = {
        id: "post_" + Date.now(),
        title: title,
        date: "September 2026",
        author: "Gary Khan",
        authorRole: "Founder & Lead Engineer",
        readTime: "5 min read",
        industryTag: tag || "Embedded Technology",
        excerpt: excerpt || title,
        content: `<h3>Project Technical Overview</h3><p>${escapeHtml(content).replace(/\\n/g, '<br>')}</p>`,
        comments: []
      };

      const posts = getStoredBlogPosts();
      posts.unshift(newPost);
      saveBlogPosts(posts);
      renderBlog();

      postNewForm.reset();
      postNewModal.close();
      showToast("New project post published to the live feed!");
    });
  }
}

/* ===================================================
   7. FAQs Accordion Logic
   =================================================== */
function initFaqAccordion() {
  const container = document.getElementById("faq-accordion");
  if (!container) return;

  container.innerHTML = MICROLAB_DATA.faqs.map((faq, index) => `
    <div class="faq-item ${index === 0 ? 'open' : ''}">
      <button class="faq-question">
        <span>${faq.question}</span>
        <span class="faq-icon">${index === 0 ? '✕' : '+'}</span>
      </button>
      <div class="faq-answer">
        <p>${faq.answer}</p>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains("open");

      // Close others
      container.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("open");
        i.querySelector(".faq-icon").textContent = "+";
      });

      if (!isOpen) {
        item.classList.add("open");
        btn.querySelector(".faq-icon").textContent = "✕";
      }
    });
  });
}

/* ===================================================
   8. Search Omnibox (⌘K / Ctrl+K)
   =================================================== */
function initSearchOmnibox() {
  const searchModal = document.getElementById("search-modal");
  const searchTrigger = document.getElementById("search-trigger-btn");
  const searchInput = document.getElementById("omnibox-input");
  const resultsList = document.getElementById("omnibox-results");

  if (!searchModal || !searchInput || !resultsList) return;

  function openSearch() {
    window.closeAllModals();
    searchModal.showModal();
    searchInput.value = "";
    performSearch("");
    setTimeout(() => searchInput.focus(), 50);
  }

  if (searchTrigger) {
    searchTrigger.addEventListener("click", openSearch);
  }

  // Keyboard shortcut ⌘K / Ctrl+K
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
    if (e.key === "Escape" && searchModal.open) {
      searchModal.close();
    }
  });

  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value.trim().toLowerCase());
  });

  function performSearch(query) {
    resultsList.innerHTML = "";

    const results = [];

    // Search Projects
    MICROLAB_DATA.projects.forEach(p => {
      if (!query || p.title.toLowerCase().includes(query) || p.shortDesc.toLowerCase().includes(query) || p.industryTag.toLowerCase().includes(query)) {
        results.push({
          type: "Project Lab",
          title: p.title,
          desc: p.consequenceFormula,
          action: () => {
            searchModal.close();
            openProjectModal(p.id);
          }
        });
      }
    });

    // Search Blog
    const posts = getStoredBlogPosts();
    posts.forEach(b => {
      if (!query || b.title.toLowerCase().includes(query) || b.excerpt.toLowerCase().includes(query)) {
        results.push({
          type: "Guide & Discussion",
          title: b.title,
          desc: b.industryTag,
          action: () => {
            searchModal.close();
            openBlogModal(b.id);
          }
        });
      }
    });

    if (results.length === 0) {
      resultsList.innerHTML = `<li style="padding: 1rem; color: var(--text-muted); text-align: center;">No matching projects or guides found for "${query}".</li>`;
      return;
    }

    results.slice(0, 8).forEach(item => {
      const li = document.createElement("li");
      li.className = "search-result-item";
      li.innerHTML = `
        <div class="search-result-info">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.desc)}</p>
        </div>
        <span class="meta-chip">${item.type}</span>
      `;
      li.addEventListener("click", item.action);
      resultsList.appendChild(li);
    });
  }
}

/* ===================================================
   9. Contact / Consultation Form
   =================================================== */
function initContactForm() {
  const form = document.getElementById("consultation-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const role = document.getElementById("contact-type").value;

    showToast(`Thank you, ${name}! Your consultation request (${role}) has been received. Gary will reach out at ${email} within 24 hours.`);
    form.reset();
  });
}

/* ===================================================
   10. Toast Helper
   =================================================== */
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>✓</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

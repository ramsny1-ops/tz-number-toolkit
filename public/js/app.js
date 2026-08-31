(() => {
  const appShell = document.getElementById("appShell");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarClose = document.getElementById("sidebarClose");
  const apiBase = window.APP?.apiBase || "/api/v1";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

  function isMobile() {
    return window.matchMedia("(max-width: 860px)").matches;
  }

  function restoreSidebar() {
    if (!appShell || isMobile()) return;
    const collapsed = localStorage.getItem("tz-sidebar-collapsed") === "true";
    appShell.classList.toggle("sidebar-collapsed", collapsed);
    sidebarToggle?.setAttribute("aria-expanded", String(!collapsed));
  }

  function toggleSidebar() {
    if (!appShell || !sidebar) return;
    if (isMobile()) {
      const open = sidebar.classList.toggle("open");
      sidebarToggle?.setAttribute("aria-expanded", String(open));
      return;
    }
    const collapsed = appShell.classList.toggle("sidebar-collapsed");
    localStorage.setItem("tz-sidebar-collapsed", String(collapsed));
    sidebarToggle?.setAttribute("aria-expanded", String(!collapsed));
  }

  sidebarToggle?.addEventListener("click", toggleSidebar);
  sidebarClose?.addEventListener("click", () => sidebar?.classList.remove("open"));
  window.addEventListener("resize", () => {
    if (!isMobile()) sidebar?.classList.remove("open");
    restoreSidebar();
  });
  restoreSidebar();

  window.showToast = (message) => {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
  };

  async function copy(value) {
    await navigator.clipboard.writeText(value);
    window.showToast?.("Copied");
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    const focusTarget = modal.querySelector("input, button, a, select, textarea");
    window.setTimeout(() => focusTarget?.focus(), 30);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    modal.hidden = true;
    if (!document.querySelector(".modal-backdrop.open")) document.body.classList.remove("modal-open");
  }

  window.openAppModal = openModal;
  window.closeAppModal = (id) => closeModal(document.getElementById(id));

  function historyTable(rows, limit) {
    const data = rows.slice(0, limit);
    if (!data.length) return '<div class="empty-state">No saved generation activity yet.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Batch</th><th>Network</th><th>Quantity</th><th>Mode</th><th>Prefix</th><th>Created</th></tr></thead><tbody>${data.map((batch) => `<tr><td><a class="table-link" href="/history/${encodeURIComponent(batch.public_id)}">${escapeHtml(batch.public_id)}</a></td><td>${escapeHtml(batch.network)}</td><td>${Number(batch.quantity).toLocaleString()}</td><td>${escapeHtml(batch.mode)}</td><td>${escapeHtml(batch.prefix || "Any")}</td><td>${escapeHtml(new Date(batch.created_at).toLocaleString())}</td></tr>`).join("")}</tbody></table></div>`;
  }

  async function loadHistory(modalId, limit) {
    const targetId = modalId === "recentActivityModal" ? "recentActivityBody" : "historyModalBody";
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = '<div class="modal-loading"><div><span class="spinner"></span><span>Reading saved batches</span></div></div>';
    try {
      const response = await fetch(`${apiBase}/generations`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Could not load history.");
      target.innerHTML = historyTable(body.data || [], limit);
    } catch (error) {
      target.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "Could not load history.")}</div>`;
    }
  }

  document.addEventListener("click", (event) => {
    const openTrigger = event.target.closest("[data-open-modal]");
    if (openTrigger) {
      const id = openTrigger.dataset.openModal;
      openModal(id);
      if (id === "historyModal" || id === "recentActivityModal") loadHistory(id, Number(openTrigger.dataset.historyLimit || (id === "recentActivityModal" ? 8 : 100)));
      if (isMobile()) sidebar?.classList.remove("open");
      return;
    }

    const closeTrigger = event.target.closest("[data-close-modal]");
    if (closeTrigger) {
      closeModal(closeTrigger.closest(".modal-backdrop"));
      return;
    }

    if (event.target.classList?.contains("modal-backdrop")) {
      closeModal(event.target);
      return;
    }

    const copyButton = event.target.closest("[data-copy], .copy-one");
    if (copyButton) {
      const value = copyButton.dataset.copy;
      if (value) copy(value).catch(() => window.showToast?.("Copy failed"));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = document.querySelector(".modal-backdrop.open");
    if (open) closeModal(open);
  });

  const quickForm = document.getElementById("quickDetectorForm");
  const quickInput = document.getElementById("quickDetectorInput");
  const quickResult = document.getElementById("quickDetectorResult");
  quickForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const phoneNumber = quickInput?.value?.trim();
    if (!phoneNumber) return window.showToast?.("Enter a phone number");
    quickResult.innerHTML = '<div class="process-mimic"><div class="process-head"><span class="spinner"></span><div><strong>Inspecting allocation</strong><div class="muted">Normalizing and matching prefix metadata</div></div></div><div class="process-steps"><div class="process-step done">Input normalized</div><div class="process-step active">Matching Tanzania prefixes</div><div class="process-step">Building allocation result</div></div></div>';
    try {
      const response = await fetch(`${apiBase}/numbers/detect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Detection failed.");
      const item = body.data;
      const network = item.allocationNetwork;
      quickResult.innerHTML = `<div class="inspection-grid"><div><span>Valid</span><strong>${item.valid ? "Yes" : "No"}</strong></div><div><span>International</span><strong>${escapeHtml(item.international || "—")}</strong></div><div><span>Prefix</span><strong>${escapeHtml(item.prefix || "—")}</strong></div><div><span>Allocation</span><strong>${escapeHtml(network?.brand || "Unknown")}</strong></div><div><span>Operator</span><strong>${escapeHtml(network?.operator || "Unknown")}</strong></div><div><span>Status</span><strong>${network ? (network.operational ? "Operational" : "Not operational") : "Unknown"}</strong></div></div><div class="notice">${escapeHtml(item.portabilityNotice || "Prefix allocation does not guarantee the current carrier.")}</div>`;
    } catch (error) {
      quickResult.innerHTML = `<div class="notice">${escapeHtml(error.message || "Detection failed.")}</div>`;
    }
  });
})();

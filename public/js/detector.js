(() => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const form = document.getElementById("detectorForm");
  const panel = document.getElementById("inspectionPanel");
  const result = document.getElementById("inspectionResult");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const phoneNumber = document.getElementById("phoneNumber").value;
    panel.classList.remove("hidden");
    result.innerHTML = '<div class="process-mimic"><div class="process-head"><span class="spinner"></span><div><strong>Inspecting number</strong><div class="muted">Normalize · validate · match allocation</div></div></div><div class="process-steps"><div class="process-step done">Input received</div><div class="process-step active">Normalizing Tanzania format</div><div class="process-step">Matching network prefix</div></div></div>';
    try {
      const response = await fetch(`${window.APP.apiBase}/numbers/detect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Detection failed");
      const item = body.data;
      const network = item.allocationNetwork;
      result.innerHTML = `<div class="section-heading"><div><span class="eyebrow">${item.valid ? "Valid allocation" : "Invalid"}</span><h3>${escapeHtml(item.international || item.input)}</h3></div></div>
        <div class="inspection-grid">
          <div><span>Valid</span><strong>${item.valid ? "Yes" : "No"}</strong></div>
          <div><span>Local</span><strong>${escapeHtml(item.local || "—")}</strong></div>
          <div><span>International</span><strong>${escapeHtml(item.international || "—")}</strong></div>
          <div><span>Prefix</span><strong>${escapeHtml(item.prefix || "—")}</strong></div>
          <div><span>Allocation network</span><strong>${escapeHtml(network?.brand || "Unknown")}</strong></div>
          <div><span>Operator</span><strong>${escapeHtml(network?.operator || "Unknown")}</strong></div>
          <div><span>Subscriber digits</span><strong>${escapeHtml(item.subscriberNumber || "—")}</strong></div>
          <div><span>Operational metadata</span><strong>${network ? (network.operational ? "Operational" : "Not operational") : "—"}</strong></div>
          <div><span>Reason</span><strong>${escapeHtml(item.reason || "Structure and prefix match")}</strong></div>
        </div><div class="notice">${escapeHtml(item.portabilityNotice)}</div>`;
    } catch (error) {
      result.innerHTML = `<div class="notice">${escapeHtml(error.message || "Detection failed")}</div>`;
      window.showToast?.(error.message || "Detection failed");
    }
  });
})();

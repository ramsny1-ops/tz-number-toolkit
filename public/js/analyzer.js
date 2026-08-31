(() => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const input = document.getElementById("bulkNumbers");
  const summary = document.getElementById("analysisSummary");
  const details = document.getElementById("analysisDetails");
  const table = document.getElementById("analysisTable");
  document.getElementById("clearAnalyzer").addEventListener("click", () => { input.value=""; summary.className="empty-state"; summary.textContent="Paste numbers to see validity and allocation distribution."; details.classList.add("hidden"); });
  document.getElementById("analyzeButton").addEventListener("click", async () => {
    const numbers = input.value.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean);
    if (!numbers.length) return window.showToast?.("Enter at least one number");
    const response = await fetch(`${window.APP.apiBase}/numbers/analyze`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({numbers}) });
    const body = await response.json();
    if (!response.ok) return window.showToast?.(body.error?.message || "Analysis failed");
    const data = body.data;
    summary.className = "analysis-cards";
    summary.innerHTML = `<div class="analysis-card"><span>Total</span><strong>${data.total.toLocaleString()}</strong></div><div class="analysis-card"><span>Valid</span><strong>${data.valid.toLocaleString()}</strong></div><div class="analysis-card"><span>Invalid</span><strong>${data.invalid.toLocaleString()}</strong></div>` + Object.entries(data.byNetwork).map(([network,count]) => `<div class="analysis-card"><span>${escapeHtml(network)}</span><strong>${count.toLocaleString()}</strong></div>`).join("");
    details.classList.remove("hidden");
    table.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Input</th><th>Valid</th><th>Normalized</th><th>Prefix</th><th>Allocation</th></tr></thead><tbody>${data.items.slice(0,1000).map((item)=>`<tr><td>${escapeHtml(item.input)}</td><td>${item.valid ? "Yes" : "No"}</td><td>${escapeHtml(item.international || "—")}</td><td>${escapeHtml(item.prefix || "—")}</td><td>${escapeHtml(item.allocationNetwork?.brand || "Unknown")}</td></tr>`).join("")}</tbody></table></div>`;
  });
})();

(() => {
  const apiBase = window.APP.apiBase;
  const networks = window.NETWORKS;
  const form = document.getElementById("generatorForm");
  const networkInput = document.getElementById("network");
  const prefixInput = document.getElementById("prefix");
  const modeInput = document.getElementById("mode");
  const seedGroup = document.getElementById("seedGroup");
  const startGroup = document.getElementById("startGroup");
  const prefixGroup = document.getElementById("prefixGroup");
  const mixedWeights = document.getElementById("mixedWeights");
  const list = document.getElementById("numbersList");
  const meta = document.getElementById("generationMeta");
  const title = document.getElementById("resultTitle");
  const button = document.getElementById("generateButton");
  const copyAll = document.getElementById("copyAll");
  const selectedNetworkName = document.getElementById("selectedNetworkName");
  const selectedNetworkMeta = document.getElementById("selectedNetworkMeta");
  const selectedNetworkBadge = document.getElementById("selectedNetworkBadge");
  let currentNumbers = [];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"\']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

  function selectedNetwork() {
    return networks.find((item) => item.slug === networkInput.value);
  }

  function updateNetworkUI() {
    const network = selectedNetwork();
    if (network) {
      selectedNetworkName.textContent = network.brand;
      selectedNetworkMeta.textContent = `${network.prefixes.join(" · ")} · ${network.operator}`;
      selectedNetworkBadge.textContent = network.brand.slice(0, 2).toUpperCase();
    } else {
      selectedNetworkName.textContent = "Mixed network";
      selectedNetworkMeta.textContent = "Weighted generation across enabled allocations";
      selectedNetworkBadge.textContent = "MX";
    }
    document.querySelectorAll("[data-select-network]").forEach((choice) => choice.classList.toggle("selected", choice.dataset.selectNetwork === networkInput.value));
  }

  function refreshPrefixes() {
    prefixInput.innerHTML = '<option value="">Any network prefix</option>';
    const network = selectedNetwork();
    network?.prefixes.forEach((prefix) => {
      const option = document.createElement("option");
      option.value = prefix;
      option.textContent = prefix;
      prefixInput.append(option);
    });
    const mixed = networkInput.value === "mixed";
    mixedWeights.classList.toggle("hidden", !mixed);
    prefixGroup.classList.toggle("hidden", mixed);
    updateNetworkUI();
  }

  function refreshMode() {
    seedGroup.classList.toggle("hidden", modeInput.value !== "seeded");
    startGroup.classList.toggle("hidden", modeInput.value !== "sequential");
  }

  document.querySelectorAll("[data-select-network]").forEach((choice) => choice.addEventListener("click", () => {
    networkInput.value = choice.dataset.selectNetwork;
    refreshPrefixes();
    window.closeAppModal?.("generatorNetworkModal");
  }));

  modeInput.addEventListener("change", refreshMode);
  refreshPrefixes();
  refreshMode();

  form.querySelectorAll("[data-step]").forEach((stepper) => stepper.addEventListener("click", () => {
    const quantity = document.getElementById("quantity");
    quantity.value = Math.max(1, Math.min(10000, Number(quantity.value || 1) + Number(stepper.dataset.step)));
  }));

  function showProcess() {
    list.classList.remove("empty-state");
    list.innerHTML = `<div class="process-mimic"><div class="process-head"><span class="spinner"></span><div><strong>Generating synthetic batch</strong><div class="muted">Mimicking backend pipeline</div></div></div><div class="process-steps"><div class="process-step done">Request validated</div><div class="process-step active" id="processPrefix">Selecting numbering prefixes</div><div class="process-step" id="processBuild">Building unique records</div><div class="process-step" id="processSave">Saving batch to SQLite</div></div></div>`;
    window.setTimeout(() => {
      document.getElementById("processPrefix")?.classList.replace("active", "done");
      document.getElementById("processBuild")?.classList.add("active");
    }, 240);
    window.setTimeout(() => {
      document.getElementById("processBuild")?.classList.replace("active", "done");
      document.getElementById("processSave")?.classList.add("active");
    }, 520);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.innerHTML = '<span class="spinner small"></span>Generating';
    title.textContent = "Generation in progress";
    meta.textContent = "Validating request and preparing allocation rules.";
    showProcess();

    const payload = {
      network: networkInput.value,
      quantity: Number(document.getElementById("quantity").value),
      format: document.getElementById("format").value,
      mode: modeInput.value,
      save: true,
      preventPreviouslyGenerated: document.getElementById("preventPreviouslyGenerated").checked,
    };
    const prefix = prefixInput.value;
    if (prefix && payload.network !== "mixed") payload.prefix = prefix;
    if (payload.mode === "seeded") payload.seed = document.getElementById("seed").value;
    if (payload.mode === "sequential") payload.startAt = Number(document.getElementById("startAt").value);
    if (payload.network === "mixed") payload.weights = Object.fromEntries([...document.querySelectorAll("[data-weight]")].map((input) => [input.dataset.weight, Number(input.value)]));

    try {
      const response = await fetch(`${apiBase}/numbers/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Generation failed.");
      currentNumbers = body.data.numbers;
      title.textContent = `${body.data.count.toLocaleString()} numbers generated`;
      meta.textContent = `${body.data.batchId} · ${payload.network} · ${payload.mode} · saved: ${body.data.saved ? "yes" : "no"}`;
      list.innerHTML = currentNumbers.slice(0, 1000).map((item, index) => `<div class="number-row" style="animation-delay:${Math.min(index, 20) * 12}ms"><code>${item.value}</code><span>${item.network} · ${item.prefix}</span><button class="copy-one" data-copy="${item.value}">Copy</button></div>`).join("");
      if (currentNumbers.length > 1000) list.insertAdjacentHTML("beforeend", `<div class="number-row"><span>UI limited to first 1,000 rows. Export contains the full saved batch.</span></div>`);
      copyAll.disabled = false;
      for (const format of ["Csv", "Json", "Txt"]) {
        const link = document.getElementById(`download${format}`);
        link.href = `${apiBase}/generations/${body.data.batchId}/export/${format.toLowerCase()}`;
        link.classList.remove("hidden");
      }
      window.showToast?.("Generation complete");
    } catch (error) {
      window.showToast?.(error.message);
      meta.textContent = error.message;
      title.textContent = "Generation failed";
      list.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "Generation failed")}</div>`;
    } finally {
      button.disabled = false;
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M3 12h18"/></svg>Generate numbers';
    }
  });

  copyAll.addEventListener("click", async () => {
    await navigator.clipboard.writeText(currentNumbers.map((item) => item.value).join("\n"));
    window.showToast?.(`Copied ${currentNumbers.length.toLocaleString()} numbers`);
  });
})();

const state = {
  tab: "invoices",
  mode: "manual",
  clients: [],
  currentInvoice: null,
  parserWarnings: [],
  invoiceView: "list",   // "list" | "create" | "summary"
  history: [],
  listSort: { col: "issue_date", dir: "desc" },
  inlineFormOpen: false,
  inlineSelectedClientId: null,
};

const el = {
  // Sidebar / tabs
  tabs: [...document.querySelectorAll(".tab")],
  panels: {
    invoices:  document.getElementById("tab-invoices"),
    clients:   document.getElementById("tab-clients"),
    dashboard: document.getElementById("tab-dashboard"),
    history:   document.getElementById("tab-history"),
  },
  banner:      document.getElementById("banner"),
  bannerMsg:   document.getElementById("banner-msg"),
  bannerClose: document.getElementById("banner-close"),
  toast:       document.getElementById("toast"),

  // Invoice list filters
  listSearch:       document.getElementById("list-search"),
  listFilterStatus: document.getElementById("list-filter-status"),
  listFilterClient: document.getElementById("list-filter-client"),
  listFilterYear:   document.getElementById("list-filter-year"),

  // Invoice views
  invListView:    document.getElementById("inv-list-view"),
  invCreateView:  document.getElementById("inv-create-view"),
  invSummaryView: document.getElementById("inv-summary-view"),
  recentInvoicesBody: document.getElementById("recent-invoices-body"),
  backToList:            document.getElementById("back-to-list"),
  backToList2:           document.getElementById("back-to-list-2"),
  newInvoiceFromSummary: document.getElementById("new-invoice-from-summary"),
  modeCards: [...document.querySelectorAll(".mode-card")],

  // Create form (legacy — used for editing via summary view)
  modeRadios:       [...document.querySelectorAll('input[name="mode"]')],
  specialBadge:     document.getElementById("special-badge"),
  clientSearch:     document.getElementById("client-search"),
  clientSelect:     document.getElementById("client-select"),
  invoiceDate:      document.getElementById("invoice-date"),
  freeText:         document.getElementById("free-text"),
  parserWarnings:   document.getElementById("parser-warnings"),
  interpretBtn:     document.getElementById("interpret-btn"),
  intelligentBlock: document.getElementById("intelligent-block"),
  manualBlock:      document.getElementById("manual-block"),
  createLinesBody:  document.getElementById("create-lines-body"),
  addLineCreate:    document.getElementById("add-line-create"),
  createNotes:      document.getElementById("create-notes"),
  createInvoiceBtn: document.getElementById("create-invoice-btn"),
  createSpecialBtn: document.getElementById("create-special-btn"),

  // Summary (preview)
  invoiceMeta:      document.getElementById("invoice-meta"),
  previewLinesBody: document.getElementById("preview-lines-body"),
  previewNotes:     document.getElementById("preview-notes"),
  addLinePreview:   document.getElementById("add-line-preview"),
  totalBase:        document.getElementById("total-base"),
  totalIva:         document.getElementById("total-iva"),
  totalFinal:       document.getElementById("total-final"),
  saveDraftBtn:     document.getElementById("save-draft-btn"),
  officializeBtn:   document.getElementById("officialize-btn"),
  officializeError: document.getElementById("officialize-error"),
  exportPdfBtn:     document.getElementById("export-pdf-btn"),
  exportXlsxBtn:    document.getElementById("export-xlsx-btn"),
  officialNumber:   document.getElementById("official-number"),

  // Clients tab
  toggleClientFormBtn: document.getElementById("toggle-client-form-btn"),
  clientFormPanel:     document.getElementById("client-form-panel"),
  clientsSearch:  document.getElementById("clients-search"),
  reloadClients:  document.getElementById("reload-clients"),
  clientsBody:    document.getElementById("clients-body"),
  clientForm:     document.getElementById("client-form"),
  clientFormReset:  document.getElementById("client-form-reset"),
  clientFormSubmit: document.getElementById("client-form-submit"),
  clientId:      document.getElementById("client-id"),
  clientName:    document.getElementById("client-name"),
  clientTaxId:   document.getElementById("client-tax-id"),
  clientAddress: document.getElementById("client-address"),
  clientCity:    document.getElementById("client-city"),
  clientPostal:  document.getElementById("client-postal"),
  clientEmail:   document.getElementById("client-email"),
  clientPhone:   document.getElementById("client-phone"),

  // History tab
  filterStatus:  document.getElementById("filter-status"),
  filterYear:    document.getElementById("filter-year"),
  filterClient:  document.getElementById("filter-client"),
  applyHistoryFilters: document.getElementById("apply-history-filters"),
  clearHistoryFilters: document.getElementById("clear-history-filters"),
  historyBody:   document.getElementById("history-body"),

  // Quick client modal (legacy, kept for create view)
  openClientModal:  document.getElementById("open-client-modal"),
  clientModal:      document.getElementById("client-modal"),
  quickClientForm:  document.getElementById("quick-client-form"),
  closeClientModal: document.getElementById("close-client-modal"),
  quickClientName:  document.getElementById("quick-client-name"),
  quickClientTax:   document.getElementById("quick-client-tax"),
  quickClientEmail: document.getElementById("quick-client-email"),
  quickClientPhone: document.getElementById("quick-client-phone"),

  // Inline creation card
  createModeBtnManual: document.getElementById("create-mode-manual"),
  inlineCreateForm:    document.getElementById("inline-create-form"),
  inlineClientInput:   document.getElementById("inline-client-input"),
  inlineClientDropdown:document.getElementById("inline-client-dropdown"),
  inlineClientId:      document.getElementById("inline-client-id"),
  inlineNewClientForm: document.getElementById("inline-new-client-form"),
  ncName:    document.getElementById("nc-name"),
  ncTax:     document.getElementById("nc-tax"),
  ncAddress: document.getElementById("nc-address"),
  ncEmail:   document.getElementById("nc-email"),
  ncPhone:   document.getElementById("nc-phone"),
  ncCancel:  document.getElementById("nc-cancel"),
  ncSave:    document.getElementById("nc-save"),
  inlineInvoiceDate: document.getElementById("inline-invoice-date"),
  inlineAddLine:     document.getElementById("inline-add-line"),
  inlineLinesBody:   document.getElementById("inline-lines-body"),
  inlineTotalBase:   document.getElementById("inline-total-base"),
  inlineTotalIva:    document.getElementById("inline-total-iva"),
  inlineTotalFinal:  document.getElementById("inline-total-final"),
  inlineNotes:       document.getElementById("inline-notes"),
  inlineCancelBtn:   document.getElementById("inline-cancel-btn"),
  inlineSaveBtn:     document.getElementById("inline-save-btn"),
};

// ── Notifications ─────────────────────────────────────────────────

function showBanner(type, text) {
  window.clearTimeout(showBanner._timer);
  el.bannerMsg.textContent = text;
  el.banner.className = `banner ${type}`;
  el.banner.hidden = false;
  if (type === "error" || type === "warning") {
    showBanner._timer = window.setTimeout(clearBanner, 7000);
  }
}

function clearBanner() {
  window.clearTimeout(showBanner._timer);
  el.banner.hidden = true;
  el.bannerMsg.textContent = "";
  el.banner.className = "banner";
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => { el.toast.hidden = true; }, 2400);
}

// ── Utilities ─────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function withLoading(button, originalLabel, fn) {
  return async (...args) => {
    button.disabled = true;
    button.textContent = "Cargando...";
    try {
      return await fn(...args);
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  };
}

function formatMoney(value) {
  const n = parseFloat(value) || 0;
  const int_part = Math.floor(Math.abs(n));
  const dec_part = Math.round((Math.abs(n) - int_part) * 100);
  const int_str = int_part.toLocaleString("es-ES");
  const sign = n < 0 ? "-" : "";
  return `${sign}${int_str},${String(dec_part).padStart(2, "0")} €`;
}

async function api(path, options = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      signal: controller.signal,
    });
    clearTimeout(tid);
    let data = null;
    try { data = await response.json(); } catch (_) { data = null; }
    if (!response.ok) {
      const error = new Error(data?.message || "Error de API");
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  } catch (err) {
    clearTimeout(tid);
    if (err.name === "AbortError") {
      const e = new Error("timeout");
      e.isTimeout = true;
      throw e;
    }
    throw err;
  }
}

function spanishError(error) {
  const code = error?.payload?.code;
  if (error.isTimeout)                 return "La solicitud tardó demasiado. Comprueba la conexión e inténtalo de nuevo.";
  if (code === "INTEGRITY_VIOLATION")  return "Se detectó una posible manipulación de datos. La exportación ha sido bloqueada por seguridad.";
  if (code === "EXPORT_UNAVAILABLE")   return "No se pudo exportar (carpeta inaccesible o sin permisos). La factura sigue oficializada.";
  if (code === "DOMAIN_ERROR")         return "Error de validación: datos insuficientes o incorrectos para esta operación.";
  if (error.status === 404)            return "No se encontró el recurso solicitado.";
  return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
}

function handleApiError(error) {
  const code = error?.payload?.code;
  const severity = (error.status === 503 && code === "EXPORT_UNAVAILABLE") ? "warning" : "error";
  showBanner(severity, spanishError(error));
}

function getClientName(clientId) {
  if (!clientId) return "-";
  const found = state.clients.find((c) => c.id === clientId);
  return found ? found.name : clientId;
}

const _statusLabels = { draft: "Borrador", official: "Enviada", paid: "Pagada", special: "Especial" };

function statusBadge(status) {
  const key = status.toLowerCase();
  return `<span class="status-badge ${key}">${_statusLabels[key] || status}</span>`;
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ── Tab navigation ────────────────────────────────────────────────

const _tabTitles = { invoices: "Facturas", clients: "Clientes", dashboard: "Dashboard", history: "Historico" };

function setTab(tabName) {
  clearBanner();
  state.tab = tabName;
  el.tabs.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === tabName));
  Object.entries(el.panels).forEach(([name, panel]) => {
    if (panel) panel.hidden = name !== tabName;
  });
  const titleEl = document.getElementById("topbar-title");
  if (titleEl) titleEl.textContent = _tabTitles[tabName] || "FactuApp";
  if (tabName === "dashboard") loadDashboard();
}

// ── Dashboard ─────────────────────────────────────────────────────

const _monthNames = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

async function loadDashboard() {
  try {
    const res = await api("/api/stats");
    renderDashboard(res);
  } catch (error) { handleApiError(error); }
}

function renderDashboard(data) {
  // --- KPI cards ---
  const byStatus = {};
  for (const r of data.by_status) byStatus[r.status] = r;

  const official = byStatus["OFFICIAL"] || { total: 0, count: 0 };
  const paid     = byStatus["PAID"]     || { total: 0, count: 0 };
  const draft    = byStatus["DRAFT"]    || { total: 0, count: 0 };
  const special  = byStatus["SPECIAL"]  || { total: 0, count: 0 };

  const totalInvoiced = official.total + paid.total;

  const kpiPending = document.getElementById("kpi-pending");
  if (kpiPending) kpiPending.textContent = formatMoney(official.total);
  const kpiPendingCount = document.getElementById("kpi-pending-count");
  if (kpiPendingCount) kpiPendingCount.textContent = `${official.count} factura${official.count !== 1 ? "s" : ""}`;

  const kpiCollected = document.getElementById("kpi-collected");
  if (kpiCollected) kpiCollected.textContent = formatMoney(paid.total);
  const kpiCollectedCount = document.getElementById("kpi-collected-count");
  if (kpiCollectedCount) kpiCollectedCount.textContent = `${paid.count} factura${paid.count !== 1 ? "s" : ""}`;

  const kpiDrafts = document.getElementById("kpi-drafts");
  if (kpiDrafts) kpiDrafts.textContent = draft.count;

  const kpiTotal = document.getElementById("kpi-total-invoiced");
  if (kpiTotal) kpiTotal.textContent = formatMoney(totalInvoiced);

  // --- Monthly bar chart (pure SVG) ---
  const chartWrap = document.getElementById("monthly-chart");
  if (chartWrap) chartWrap.innerHTML = renderBarChart(data.monthly_income);

  // --- Status breakdown table ---
  const statusBody = document.getElementById("status-breakdown-body");
  if (statusBody) {
    const order = ["DRAFT", "OFFICIAL", "PAID", "SPECIAL"];
    statusBody.innerHTML = order
      .filter((s) => byStatus[s])
      .map((s) => {
        const r = byStatus[s];
        return `<tr>
          <td>${statusBadge(s)}</td>
          <td class="col-num">${r.count}</td>
          <td class="col-num">${formatMoney(r.total)}</td>
        </tr>`;
      }).join("");
  }

  // --- Top clients table ---
  const clientsBody = document.getElementById("top-clients-body");
  if (clientsBody) {
    clientsBody.innerHTML = data.top_clients.map((c) => `<tr>
      <td>${c.name}</td>
      <td class="col-num">${c.count}</td>
      <td class="col-num">${formatMoney(c.total)}</td>
    </tr>`).join("") || `<tr><td colspan="3" class="empty-state">Sin datos</td></tr>`;
  }
}

function renderBarChart(monthlyIncome) {
  // Build a map of existing data
  const dataMap = {};
  for (const r of monthlyIncome) dataMap[r.month] = r.total;

  // Generate all 12 months
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: _monthNames[d.getMonth()], value: dataMap[key] || 0 });
  }

  const maxVal = Math.max(...months.map((m) => m.value), 1);
  const W = 600, H = 160, BAR_W = 32, GAP = 14;
  const totalW = months.length * (BAR_W + GAP) - GAP;
  const startX = (W - totalW) / 2;
  const MAX_BAR_H = H - 40; // leave room for labels top and bottom

  const bars = months.map((m, i) => {
    const barH = Math.max(Math.round((m.value / maxVal) * MAX_BAR_H), m.value > 0 ? 4 : 0);
    const x = startX + i * (BAR_W + GAP);
    const y = H - 20 - barH;
    const label = m.value > 0 ? (m.value >= 1000
      ? `${Math.round(m.value / 1000)}k`
      : Math.round(m.value).toString()) : "";
    return `
      <rect x="${x}" y="${y}" width="${BAR_W}" height="${barH}" rx="4" fill="var(--primary)" opacity="0.85"/>
      ${label ? `<text x="${x + BAR_W / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="var(--muted)">${label}</text>` : ""}
      <text x="${x + BAR_W / 2}" y="${H - 4}" text-anchor="middle" font-size="10" fill="var(--muted)">${m.label}</text>
    `;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;overflow:visible">${bars}</svg>`;
}

// ── Invoice view state machine ────────────────────────────────────

function setInvoiceView(view) {
  clearBanner();
  if (el.officializeError) el.officializeError.hidden = true;
  state.invoiceView = view;
  el.invListView.hidden    = view !== "list";
  el.invCreateView.hidden  = view !== "create";
  el.invSummaryView.hidden = view !== "summary";
}

// ── Mode selector (legacy create view) ───────────────────────────

function setMode(mode) {
  state.mode = mode;
  el.specialBadge.hidden    = mode !== "special";
  el.intelligentBlock.hidden = mode !== "intelligent";
  el.manualBlock.hidden      = mode === "intelligent";
  el.createInvoiceBtn.hidden = mode === "special";
  el.createSpecialBtn.hidden = mode !== "special";
  clearBanner();
}

// ── Line rendering (legacy create view) ──────────────────────────

function emptyLineRow() {
  return { description: "", quantity: "1", unit: "ud", unit_price: "0.00", line_total: "0.00" };
}

function lineInput(name, value = "", disabled = false) {
  return `<input data-col="${name}" value="${value}" ${disabled ? "disabled" : ""} />`;
}

function numberInput(name, value = "", disabled = false) {
  return `<input data-col="${name}" value="${value}" inputmode="decimal" ${disabled ? "disabled" : ""} />`;
}

function renderCreateLines(lines = []) {
  const data = lines.length ? lines : [emptyLineRow()];
  el.createLinesBody.innerHTML = data.map((line, index) => `
    <tr>
      <td>${lineInput("description", line.description)}</td>
      <td>${numberInput("quantity", line.quantity)}</td>
      <td>${lineInput("unit", line.unit || "ud")}</td>
      <td>${numberInput("unit_price", line.unit_price)}</td>
      <td style="text-align:right"><button type="button" class="ghost btn-sm" data-action="remove-create" data-index="${index}">✕</button></td>
    </tr>`).join("");
}

function collectCreateLines() {
  return [...el.createLinesBody.querySelectorAll("tr")]
    .map((row) => ({
      description: row.querySelector('[data-col="description"]').value.trim(),
      quantity:    row.querySelector('[data-col="quantity"]').value.trim() || "1",
      unit:        row.querySelector('[data-col="unit"]').value.trim() || "ud",
      unit_price:  row.querySelector('[data-col="unit_price"]').value.trim() || "0",
    }))
    .filter((line) => line.description);
}

function renderParserWarnings(warnings = []) {
  el.parserWarnings.innerHTML = warnings.map((w) => `<li>${w}</li>`).join("");
}

// ── Preview / summary ─────────────────────────────────────────────

function renderPreview() {
  const invoice = state.currentInvoice;
  const editable = invoice && invoice.status === "DRAFT";

  el.addLinePreview.disabled = !editable;
  el.saveDraftBtn.disabled   = !editable;
  el.officializeBtn.disabled = !editable;
  el.previewNotes.disabled   = !editable;
  el.exportPdfBtn.disabled   = !invoice || !["OFFICIAL", "SPECIAL", "PAID"].includes(invoice.status);
  el.exportXlsxBtn.disabled  = !invoice || !["OFFICIAL", "SPECIAL", "PAID"].includes(invoice.status);

  if (!invoice) {
    el.invoiceMeta.textContent = "Sin factura cargada.";
    el.previewLinesBody.innerHTML = "";
    el.previewNotes.value = "";
    el.totalBase.textContent  = "0.00";
    el.totalIva.textContent   = "0.00";
    el.totalFinal.textContent = "0.00";
    el.officialNumber.hidden = true;
    return;
  }

  const labelNumber = invoice.official_code || invoice.status;
  el.invoiceMeta.innerHTML =
    `<strong>${labelNumber}</strong> &nbsp;·&nbsp; ${statusBadge(invoice.status)} &nbsp;·&nbsp; ` +
    `${getClientName(invoice.client_id)} &nbsp;·&nbsp; ${invoice.issue_date}`;

  el.previewLinesBody.innerHTML = (invoice.lines || []).map((line, index) => `
    <tr>
      <td>${lineInput("description", line.description, !editable)}</td>
      <td>${numberInput("quantity", line.quantity, !editable)}</td>
      <td>${lineInput("unit", line.unit || "ud", !editable)}</td>
      <td>${numberInput("unit_price", line.unit_price, !editable)}</td>
      <td>${line.line_total || "-"}</td>
      <td style="text-align:right">${editable
        ? `<button type="button" class="ghost btn-sm" data-action="remove-preview" data-index="${index}">✕</button>`
        : ""}</td>
    </tr>`).join("");

  el.previewNotes.value     = invoice.notes || "";
  el.totalBase.textContent  = invoice.subtotal   || "0.00";
  el.totalIva.textContent   = invoice.tax_amount || "0.00";
  el.totalFinal.textContent = invoice.total      || "0.00";

  if (invoice.status === "OFFICIAL" || invoice.status === "PAID") {
    el.officialNumber.hidden = false;
    const label = invoice.status === "PAID" ? "Pagada" : "Oficial";
    el.officialNumber.textContent = `✓ Factura ${label}: ${invoice.official_code}`;
  } else {
    el.officialNumber.hidden = true;
  }
}

function collectPreviewLines() {
  return [...el.previewLinesBody.querySelectorAll("tr")]
    .map((row) => ({
      description: row.querySelector('[data-col="description"]').value.trim(),
      quantity:    row.querySelector('[data-col="quantity"]').value.trim() || "1",
      unit:        row.querySelector('[data-col="unit"]').value.trim() || "ud",
      unit_price:  row.querySelector('[data-col="unit_price"]').value.trim() || "0",
    }))
    .filter((line) => line.description);
}

function setCurrentInvoice(data) {
  state.currentInvoice = data
    ? { ...data, lines: (data.lines || []).map((l) => ({ ...l, unit: l.unit || "ud" })) }
    : null;
  renderPreview();
  if (data) setInvoiceView("summary");
}

// ── Inline creation card ──────────────────────────────────────────

function openInlineForm() {
  state.inlineFormOpen = true;
  state.inlineSelectedClientId = null;
  el.inlineCreateForm.hidden = false;
  el.inlineClientInput.value = "";
  el.inlineClientId.value = "";
  el.inlineClientDropdown.hidden = true;
  el.inlineNewClientForm.hidden = true;
  el.inlineInvoiceDate.value = todayIso();
  el.inlineNotes.value = "";
  renderInlineLines([emptyInlineLine()]);
  recalcInlineTotals();
  el.createModeBtnManual.classList.add("is-active");
}

function closeInlineForm() {
  state.inlineFormOpen = false;
  el.inlineCreateForm.hidden = true;
  el.createModeBtnManual.classList.remove("is-active");
}

// Client autocomplete

function emptyInlineLine() {
  return { description: "", quantity: "1", unit_price: "0.00", discount_pct: "0" };
}

function calcLineTotalWithDiscount(qty, price, discount) {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  const d = parseFloat(discount) || 0;
  return formatMoney(q * p * (1 - d / 100));
}

function renderInlineLines(lines = []) {
  const data = lines.length ? lines : [emptyInlineLine()];
  el.inlineLinesBody.innerHTML = data.map((line, idx) => `
    <tr>
      <td><input class="il-desc" data-idx="${idx}" value="${escHtml(line.description)}" placeholder="Descripción..." /></td>
      <td><input class="il-qty"  data-idx="${idx}" value="${line.quantity}" inputmode="decimal" style="width:60px" /></td>
      <td><input class="il-price" data-idx="${idx}" value="${line.unit_price}" inputmode="decimal" style="width:90px" /></td>
      <td style="text-align:center;color:var(--muted)">21%</td>
      <td><input class="il-discount" data-idx="${idx}" value="${line.discount_pct || "0"}" inputmode="decimal" style="width:52px" /></td>
      <td class="il-total" style="text-align:right;font-weight:600" data-idx="${idx}">${calcLineTotalWithDiscount(line.quantity, line.unit_price, line.discount_pct || "0")}</td>
      <td style="text-align:right"><button type="button" class="ghost btn-sm" data-action="remove-inline" data-idx="${idx}">✕</button></td>
    </tr>`).join("");
}

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function calcLineTotal(qty, price) {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  return formatMoney(q * p);
}

function recalcInlineTotals() {
  let base = 0;
  el.inlineLinesBody.querySelectorAll("tr").forEach((row) => {
    const q = parseFloat(row.querySelector(".il-qty")?.value) || 0;
    const p = parseFloat(row.querySelector(".il-price")?.value) || 0;
    const d = parseFloat(row.querySelector(".il-discount")?.value) || 0;
    const lineTotal = q * p * (1 - d / 100);
    base += lineTotal;
    const totalCell = row.querySelector(".il-total");
    if (totalCell) totalCell.textContent = formatMoney(lineTotal);
  });
  const iva   = base * 0.21;
  const total = base + iva;
  el.inlineTotalBase.textContent  = formatMoney(base);
  el.inlineTotalIva.textContent   = formatMoney(iva);
  el.inlineTotalFinal.textContent = formatMoney(total);
}

function collectInlineLines() {
  return [...el.inlineLinesBody.querySelectorAll("tr")].map((row) => ({
    description:  row.querySelector(".il-desc")?.value.trim() || "",
    quantity:     row.querySelector(".il-qty")?.value.trim()  || "1",
    unit_price:   row.querySelector(".il-price")?.value.trim() || "0",
    discount_pct: row.querySelector(".il-discount")?.value.trim() || "0",
  })).filter((l) => l.description);
}

// Client autocomplete logic

async function searchClientsForDropdown(text) {
  try {
    const res = await api(`/api/clients?search=${encodeURIComponent(text)}`);
    return res.data || [];
  } catch (_) {
    return [];
  }
}

function showClientDropdown(clients) {
  if (!clients.length && !el.inlineClientInput.value.trim()) {
    el.inlineClientDropdown.hidden = true;
    return;
  }
  const items = clients.map((c) =>
    `<div class="client-dropdown-item" data-id="${c.id}" data-name="${escHtml(c.name)}">
      <strong>${escHtml(c.name)}</strong>${c.tax_id ? ` <span class="muted-text">${c.tax_id}</span>` : ""}
    </div>`
  ).join("");
  const createItem = `<div class="client-dropdown-item client-dropdown-create" data-action="new-client">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    Crear cliente nuevo
  </div>`;
  el.inlineClientDropdown.innerHTML = items + createItem;
  el.inlineClientDropdown.hidden = false;
}

function hideClientDropdown() {
  el.inlineClientDropdown.hidden = true;
}

function selectInlineClient(id, name) {
  state.inlineSelectedClientId = id;
  el.inlineClientId.value  = id;
  el.inlineClientInput.value = name;
  hideClientDropdown();
  el.inlineNewClientForm.hidden = true;
}

function openMiniClientForm() {
  hideClientDropdown();
  el.inlineNewClientForm.hidden = false;
  el.ncName.value = el.inlineClientInput.value.trim();
  el.ncTax.value = "";
  el.ncAddress.value = "";
  el.ncEmail.value = "";
  el.ncPhone.value = "";
  el.ncName.focus();
}

async function saveMiniClient() {
  const name = el.ncName.value.trim();
  if (!name) { showBanner("error", "El nombre del cliente es obligatorio."); return; }
  try {
    el.ncSave.disabled = true;
    const res = await api("/api/clients", {
      method: "POST",
      body: JSON.stringify({
        name,
        tax_id:  el.ncTax.value.trim()     || null,
        address: el.ncAddress.value.trim() || null,
        email:   el.ncEmail.value.trim()   || null,
        phone:   el.ncPhone.value.trim()   || null,
      }),
    });
    const client = res.data;
    await refreshClients();
    selectInlineClient(client.id, client.name);
    el.inlineNewClientForm.hidden = true;
    toast("Cliente creado");
  } catch (error) {
    handleApiError(error);
  } finally {
    el.ncSave.disabled = false;
  }
}

async function saveInlineDraft() {
  clearBanner();
  const lines = collectInlineLines();
  if (!lines.length) { showBanner("error", "Debes añadir al menos una línea."); return; }
  const payload = {
    client_id:  el.inlineClientId.value || null,
    issue_date: el.inlineInvoiceDate.value,
    notes:      el.inlineNotes.value.trim() || null,
    lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unit_price, discount_pct: l.discount_pct || "0" })),
  };
  try {
    el.inlineSaveBtn.disabled = true;
    const res = await api("/api/invoices/drafts/manual", { method: "POST", body: JSON.stringify(payload) });
    closeInlineForm();
    setCurrentInvoice(res.data);
    toast("Borrador creado");
    clearBanner();
    await loadHistory();
  } catch (error) {
    handleApiError(error);
  } finally {
    el.inlineSaveBtn.disabled = false;
  }
}

// ── Invoice table ─────────────────────────────────────────────────

function applyListFilters(rows) {
  const search  = (el.listSearch?.value || "").toLowerCase().trim();
  const status  = el.listFilterStatus?.value || "";
  const client  = el.listFilterClient?.value || "";
  const year    = el.listFilterYear?.value   || "";
  return rows.filter((inv) => {
    if (status && inv.status !== status) return false;
    if (client && inv.client_id !== client) return false;
    if (year   && !inv.issue_date.startsWith(year)) return false;
    if (search) {
      const num  = (inv.official_code || inv.status).toLowerCase();
      const name = getClientName(inv.client_id).toLowerCase();
      if (!num.includes(search) && !name.includes(search)) return false;
    }
    return true;
  });
}

function sortRows(rows) {
  const { col, dir } = state.listSort;
  return [...rows].sort((a, b) => {
    let va = a[col] ?? "";
    let vb = b[col] ?? "";
    // Numeric columns
    if (["subtotal", "tax_amount", "total"].includes(col)) {
      va = parseFloat(va) || 0;
      vb = parseFloat(vb) || 0;
    }
    if (va < vb) return dir === "asc" ? -1 :  1;
    if (va > vb) return dir === "asc" ?  1 : -1;
    return 0;
  });
}

function accionesFilaFactura(invoice) {
  const canDownload = ["OFFICIAL", "SPECIAL", "PAID"].includes(invoice.status);
  const isDraft     = invoice.status === "DRAFT";
  const isOfficial  = invoice.status === "OFFICIAL";
  const isPaid      = invoice.status === "PAID";
  const canRectify  = isOfficial || isPaid;
  return `<div class="inline">
    <button type="button" class="ghost btn-sm" data-action="open-invoice" data-id="${invoice.id}">${isDraft ? "Editar" : "Ver"}</button>
    ${isOfficial ? `<button type="button" class="ghost btn-sm" data-action="mark-paid" data-id="${invoice.id}">Marcar Pagada</button>` : ""}
    ${canRectify  ? `<button type="button" class="ghost btn-sm" data-action="create-rectificativa" data-id="${invoice.id}">Rectificativa</button>` : ""}
    <button type="button" class="ghost btn-sm" data-action="download-pdf"  data-id="${invoice.id}" ${canDownload ? "" : "disabled"}>PDF</button>
    <button type="button" class="ghost btn-sm" data-action="download-xlsx" data-id="${invoice.id}" ${canDownload ? "" : "disabled"}>Excel</button>
  </div>`;
}

function updateSortIcons() {
  document.querySelectorAll(".sortable-th").forEach((th) => {
    const col = th.dataset.sort;
    const icon = th.querySelector(".sort-icon");
    if (!icon) return;
    if (col === state.listSort.col) {
      icon.textContent = state.listSort.dir === "asc" ? "↑" : "↓";
      th.classList.add("sort-active");
    } else {
      icon.textContent = "↕";
      th.classList.remove("sort-active");
    }
  });
}

function renderTablaFacturas(rows) {
  if (!el.recentInvoicesBody) return;
  if (rows === null) {
    el.recentInvoicesBody.innerHTML =
      `<tr><td colspan="8" class="empty-state">Error al cargar las facturas. <button id="retry-recent" class="ghost btn-sm">Reintentar</button></td></tr>`;
    return;
  }
  const filtered = applyListFilters(rows);
  const sorted   = sortRows(filtered);
  updateSortIcons();

  if (!sorted.length) {
    el.recentInvoicesBody.innerHTML =
      `<tr><td colspan="8" class="empty-state">${rows.length ? "No hay facturas para los filtros aplicados" : "Aún no hay facturas — créala pulsando <strong>Nueva factura manual</strong>"}</td></tr>`;
    return;
  }
  el.recentInvoicesBody.innerHTML = sorted.map((inv) => {
    const number = inv.official_code || "-";
    return `<tr>
      <td style="font-weight:600">${number}</td>
      <td>${inv.issue_date}</td>
      <td>${getClientName(inv.client_id)}</td>
      <td>${statusBadge(inv.status)}</td>
      <td class="col-num">${inv.subtotal || "0.00"}</td>
      <td class="col-num">${inv.tax_amount || "0.00"}</td>
      <td class="col-num" style="font-weight:600">${inv.total || "0.00"}</td>
      <td>${accionesFilaFactura(inv)}</td>
    </tr>`;
  }).join("");
}

// Keep alias for backward compat (history tab uses this)
function renderRecentInvoices(rows) {
  renderTablaFacturas(rows);
}

// ── Download invoice (binary blob) ───────────────────────────────

async function downloadInvoice(invoiceId, ext) {
  clearBanner();
  try {
    const resp = await fetch(`/api/invoices/${invoiceId}/export/${ext}`, { method: "POST" });
    if (!resp.ok) {
      let payload = null;
      try { payload = await resp.json(); } catch (_) {}
      const err = new Error(payload?.message || "Export error");
      err.status = resp.status;
      err.payload = payload;
      throw err;
    }
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast(`${ext.toUpperCase()} generado — abriendo...`);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    await loadHistory();
  } catch (error) {
    handleApiError(error);
  }
}

// Legacy export (summary view buttons)
async function exportCurrent(ext) {
  if (!state.currentInvoice) return;
  await downloadInvoice(state.currentInvoice.id, ext);
}

// ── Clients ───────────────────────────────────────────────────────

function toggleClientForm(open) {
  el.clientFormPanel.hidden = !open;
  if (el.toggleClientFormBtn) {
    el.toggleClientFormBtn.textContent = open ? "× Cerrar" : "+ Nuevo cliente";
    el.toggleClientFormBtn.className = open ? "ghost btn-sm" : "btn-primary-sm";
  }
}

async function refreshClients() {
  try {
    const res = await api("/api/clients");
    state.clients = res.data || [];
  } catch (error) {
    handleApiError(error);
    state.clients = [];
  }
  renderClientSelectors();
  renderClientsTable();
}

function renderClientSelectors() {
  // Legacy create-view client selector
  if (el.clientSearch && el.clientSelect) {
    const search = (el.clientSearch.value || "").toLowerCase().trim();
    const filtered = state.clients.filter((c) =>
      !search || `${c.name} ${c.tax_id || ""}`.toLowerCase().includes(search)
    );
    const opts = filtered.map((c) => `<option value="${c.id}">${c.name}${c.tax_id ? ` (${c.tax_id})` : ""}</option>`);
    el.clientSelect.innerHTML = ['<option value="">-- Selecciona cliente --</option>'].concat(opts).join("");
  }
  const allOpt = '<option value="">Todos</option>';
  const clientOpts = state.clients.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  if (el.filterClient)    el.filterClient.innerHTML    = allOpt + clientOpts;
  if (el.listFilterClient) el.listFilterClient.innerHTML = allOpt + clientOpts;
}

function renderClientsTable() {
  const search = (el.clientsSearch?.value || "").toLowerCase().trim();
  const data = state.clients.filter((c) =>
    !search || `${c.name} ${c.tax_id || ""} ${c.email || ""}`.toLowerCase().includes(search)
  );
  if (!data.length) {
    el.clientsBody.innerHTML =
      `<tr><td colspan="5" class="empty-state">No se encontraron clientes</td></tr>`;
    return;
  }
  el.clientsBody.innerHTML = data.map((c) => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.tax_id || "-"}</td>
      <td>${c.email || "-"}</td>
      <td>${c.phone || "-"}</td>
      <td style="text-align:right"><button type="button" class="ghost btn-sm" data-action="edit-client" data-id="${c.id}">Editar</button></td>
    </tr>`).join("");
}

function resetClientForm() {
  el.clientId.value      = "";
  el.clientName.value    = "";
  el.clientTaxId.value   = "";
  el.clientAddress.value = "";
  el.clientCity.value    = "";
  el.clientPostal.value  = "";
  el.clientEmail.value   = "";
  el.clientPhone.value   = "";
  el.clientFormSubmit.textContent = "Guardar cliente";
  toggleClientForm(false);
}

function fillClientForm(client) {
  el.clientId.value      = client.id;
  el.clientName.value    = client.name        || "";
  el.clientTaxId.value   = client.tax_id      || "";
  el.clientAddress.value = client.address     || "";
  el.clientCity.value    = client.city        || "";
  el.clientPostal.value  = client.postal_code || "";
  el.clientEmail.value   = client.email       || "";
  el.clientPhone.value   = client.phone       || "";
  el.clientFormSubmit.textContent = "Actualizar cliente";
  toggleClientForm(true);
}

async function saveClient(event) {
  event.preventDefault();
  clearBanner();
  const payload = {
    name:        el.clientName.value.trim(),
    tax_id:      el.clientTaxId.value.trim()   || null,
    address:     el.clientAddress.value.trim() || null,
    city:        el.clientCity.value.trim()    || null,
    postal_code: el.clientPostal.value.trim()  || null,
    email:       el.clientEmail.value.trim()   || null,
    phone:       el.clientPhone.value.trim()   || null,
  };
  if (!payload.name) { showBanner("error", "El nombre del cliente es obligatorio."); return; }
  try {
    if (el.clientId.value) {
      await api(`/api/clients/${el.clientId.value}`, { method: "PUT", body: JSON.stringify(payload) });
      toast("Cliente actualizado");
    } else {
      await api("/api/clients", { method: "POST", body: JSON.stringify(payload) });
      toast("Cliente creado");
    }
    clearBanner();
    resetClientForm();
    await refreshClients();
  } catch (error) { handleApiError(error); }
}

// ── Invoice creation (legacy create view) ────────────────────────

async function createDraftManual() {
  clearBanner();
  const lines = collectCreateLines();
  if (!lines.length) { showBanner("error", "Debes agregar al menos una linea."); return; }
  const payload = {
    client_id:  el.clientSelect.value || null,
    issue_date: el.invoiceDate.value,
    notes:      el.createNotes.value.trim() || null,
    lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unit_price })),
  };
  try {
    const res = await api("/api/invoices/drafts/manual", { method: "POST", body: JSON.stringify(payload) });
    setCurrentInvoice(res.data);
    toast("Borrador creado");
    clearBanner();
    await loadHistory();
  } catch (error) { handleApiError(error); }
}

async function createSpecial() {
  clearBanner();
  const lines = collectCreateLines();
  if (!lines.length) { showBanner("error", "Debes agregar al menos una linea."); return; }
  const payload = {
    client_id:  el.clientSelect.value || null,
    issue_date: el.invoiceDate.value,
    notes:      el.createNotes.value.trim() || null,
    lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unit_price })),
  };
  try {
    const res = await api("/api/invoices/special", { method: "POST", body: JSON.stringify(payload) });
    setCurrentInvoice(res.data);
    toast("Factura especial creada (NO OFICIAL)");
    clearBanner();
    await loadHistory();
  } catch (error) { handleApiError(error); }
}

async function interpretFreeText() {
  clearBanner();
  const text = el.freeText.value.trim();
  if (!text) { showBanner("error", "Debes introducir texto libre para interpretar."); return; }
  try {
    const res = await api("/api/invoices/drafts/free-text", {
      method: "POST",
      body: JSON.stringify({ issue_date: el.invoiceDate.value, notes: null, text }),
    });
    setCurrentInvoice(res.data);
    state.parserWarnings = res.warnings || [];
    renderParserWarnings(state.parserWarnings);
    toast("Factura creada a partir de texto");
    clearBanner();
    if (res.client_hint && !el.clientSelect.value) {
      window.setTimeout(() => toast(`Cliente detectado: ${res.client_hint} — selecciónalo si procede.`), 2500);
    }
    await loadHistory();
  } catch (error) { handleApiError(error); }
}

async function saveDraftEdits() {
  if (!state.currentInvoice || state.currentInvoice.status !== "DRAFT") return;
  clearBanner();
  const lines = collectPreviewLines();
  if (!lines.length) { showBanner("error", "La factura debe tener lineas."); return; }
  try {
    const res = await api(`/api/invoices/drafts/${state.currentInvoice.id}`, {
      method: "PUT",
      body: JSON.stringify({
        notes: el.previewNotes.value.trim() || null,
        lines: lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unit_price })),
      }),
    });
    setCurrentInvoice(res.data);
    toast("Borrador actualizado");
    clearBanner();
    await loadHistory();
  } catch (error) { handleApiError(error); }
}

async function officializeCurrent() {
  if (!state.currentInvoice || state.currentInvoice.status !== "DRAFT") return;
  clearBanner();
  if (el.officializeError) el.officializeError.hidden = true;
  try {
    const res = await api(`/api/invoices/${state.currentInvoice.id}/officialize`, { method: "POST" });
    setCurrentInvoice(res.data);
    toast(`Factura oficializada: ${res.data.official_code}`);
    clearBanner();
    await loadHistory();
  } catch (error) {
    if (el.officializeError) {
      el.officializeError.textContent = spanishError(error);
      el.officializeError.hidden = false;
    } else {
      handleApiError(error);
    }
  }
}

async function markPaid(invoiceId) {
  clearBanner();
  try {
    const res = await api(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
    toast(`Factura marcada como Pagada`);
    clearBanner();
    await loadHistory();
    if (state.currentInvoice && state.currentInvoice.id === invoiceId) {
      setCurrentInvoice(res.data);
    }
  } catch (error) { handleApiError(error); }
}

async function createRectificativa(invoiceId) {
  clearBanner();
  try {
    const res = await api(`/api/invoices/${invoiceId}/rectificativa`, { method: "POST" });
    toast("Rectificativa creada como borrador");
    clearBanner();
    await loadHistory();
    setCurrentInvoice(res.data);
    setTab("invoices");
  } catch (error) { handleApiError(error); }
}

// ── History ───────────────────────────────────────────────────────

function getHistoryQuery() {
  const params = new URLSearchParams();
  if (el.filterStatus.value) params.set("status", el.filterStatus.value);
  if (el.filterYear.value)   params.set("year",   el.filterYear.value);
  if (el.filterClient.value) params.set("client", el.filterClient.value);
  const q = params.toString();
  return q ? `?${q}` : "";
}

async function loadHistory() {
  try {
    const res = await api(`/api/invoices${getHistoryQuery()}`);
    state.history = res.data || [];
    renderHistory(state.history);
    renderTablaFacturas(state.history);
  } catch (error) {
    handleApiError(error);
    renderTablaFacturas(null);
    const retryBtn = document.getElementById("retry-recent");
    if (retryBtn) retryBtn.addEventListener("click", () => loadHistory());
  }
}

function renderHistory(rows) {
  if (!rows.length) {
    el.historyBody.innerHTML =
      `<tr><td colspan="6" class="empty-state">No hay facturas para los filtros seleccionados</td></tr>`;
    return;
  }
  el.historyBody.innerHTML = rows.map((invoice) => {
    const number    = invoice.official_code || invoice.status;
    const canExport = ["OFFICIAL", "SPECIAL", "PAID"].includes(invoice.status);
    const isDraft   = invoice.status === "DRAFT";
    return `<tr>
      <td>${invoice.issue_date}</td>
      <td style="font-weight:600">${number}</td>
      <td>${getClientName(invoice.client_id)}</td>
      <td style="font-weight:600">${invoice.total}</td>
      <td>${statusBadge(invoice.status)}</td>
      <td>
        <div class="inline">
          <button type="button" class="ghost btn-sm" data-action="open-invoice"          data-id="${invoice.id}">${isDraft ? "Continuar" : "Ver"}</button>
          <button type="button" class="ghost btn-sm" data-action="history-export-pdf"    data-id="${invoice.id}" ${canExport ? "" : "disabled"}>PDF</button>
          <button type="button" class="ghost btn-sm" data-action="history-export-xlsx"   data-id="${invoice.id}" ${canExport ? "" : "disabled"}>Excel</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

async function openInvoice(invoiceId) {
  try {
    const res = await api(`/api/invoices/${invoiceId}`);
    setCurrentInvoice(res.data);
    setTab("invoices");
    toast("Factura cargada");
    clearBanner();
  } catch (error) { handleApiError(error); }
}

// ── Event binding ─────────────────────────────────────────────────

function bindTableActions(tbody) {
  tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.dataset.id;
    if (!id) return;
    if (target.dataset.action === "open-invoice")           openInvoice(id);
    if (target.dataset.action === "download-pdf")           downloadInvoice(id, "pdf");
    if (target.dataset.action === "download-xlsx")          downloadInvoice(id, "xlsx");
    if (target.dataset.action === "history-export-pdf")     downloadInvoice(id, "pdf");
    if (target.dataset.action === "history-export-xlsx")    downloadInvoice(id, "xlsx");
    if (target.dataset.action === "mark-paid")              markPaid(id);
    if (target.dataset.action === "create-rectificativa")   createRectificativa(id);
  });
}

function bindEvents() {
  // Banner dismiss
  el.bannerClose.addEventListener("click", clearBanner);

  // Sidebar navigation
  el.tabs.forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  // ── Inline creation card ──────────────────────────────────────

  el.createModeBtnManual.addEventListener("click", () => {
    if (state.inlineFormOpen) {
      closeInlineForm();
    } else {
      openInlineForm();
    }
  });

  el.inlineCancelBtn.addEventListener("click", closeInlineForm);

  // Client autocomplete
  const doSearch = debounce(async () => {
    const text = el.inlineClientInput.value.trim();
    if (!text) { hideClientDropdown(); return; }
    const clients = await searchClientsForDropdown(text);
    showClientDropdown(clients);
  }, 300);

  el.inlineClientInput.addEventListener("input", doSearch);
  el.inlineClientInput.addEventListener("focus", doSearch);

  el.inlineClientDropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".client-dropdown-item");
    if (!item) return;
    if (item.dataset.action === "new-client") {
      openMiniClientForm();
      return;
    }
    selectInlineClient(item.dataset.id, item.dataset.name);
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!el.inlineClientInput.contains(e.target) && !el.inlineClientDropdown.contains(e.target)) {
      hideClientDropdown();
    }
  });

  el.ncCancel.addEventListener("click", () => { el.inlineNewClientForm.hidden = true; });
  el.ncSave.addEventListener("click", saveMiniClient);

  // Inline lines
  el.inlineAddLine.addEventListener("click", () => {
    const current = collectInlineLines();
    current.push(emptyInlineLine());
    renderInlineLines(current);
  });

  el.inlineLinesBody.addEventListener("input", (e) => {
    if (e.target.classList.contains("il-qty") || e.target.classList.contains("il-price") || e.target.classList.contains("il-discount")) {
      recalcInlineTotals();
    }
  });

  el.inlineLinesBody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='remove-inline']");
    if (!btn) return;
    const rows = [...el.inlineLinesBody.querySelectorAll("tr")];
    const idx = parseInt(btn.dataset.idx, 10);
    rows[idx]?.remove();
    recalcInlineTotals();
  });

  el.inlineSaveBtn.addEventListener("click", saveInlineDraft);

  // ── Sortable table headers ────────────────────────────────────

  document.querySelectorAll(".sortable-th").forEach((th) => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (state.listSort.col === col) {
        state.listSort.dir = state.listSort.dir === "asc" ? "desc" : "asc";
      } else {
        state.listSort.col = col;
        state.listSort.dir = "asc";
      }
      renderTablaFacturas(state.history);
    });
  });

  // ── Legacy invoice view flow ─────────────────────────────────

  el.backToList.addEventListener("click",  () => setInvoiceView("list"));
  el.backToList2.addEventListener("click", () => setInvoiceView("list"));

  el.newInvoiceFromSummary.addEventListener("click", () => {
    closeInlineForm();
    openInlineForm();
    setInvoiceView("list");
  });

  // Mode choice cards (legacy create view)
  el.modeCards.forEach((card) => {
    card.addEventListener("click", () => {
      el.modeCards.forEach((c) => c.classList.toggle("is-active", c === card));
      const radio = document.querySelector(`input[name="mode"][value="${card.dataset.mode}"]`);
      if (radio) radio.checked = true;
      setMode(card.dataset.mode);
    });
  });

  el.modeRadios.forEach((radio) => {
    radio.addEventListener("change", () => setMode(radio.value));
  });

  el.clientSearch.addEventListener("input", renderClientSelectors);

  el.addLineCreate.addEventListener("click", () => {
    const lines = collectCreateLines();
    lines.push(emptyLineRow());
    renderCreateLines(lines);
  });
  el.createLinesBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.dataset.action !== "remove-create") return;
    const lines = collectCreateLines();
    lines.splice(Number(target.dataset.index), 1);
    renderCreateLines(lines);
  });

  el.addLinePreview.addEventListener("click", () => {
    if (!state.currentInvoice || state.currentInvoice.status !== "DRAFT") return;
    state.currentInvoice.lines.push(emptyLineRow());
    renderPreview();
  });
  el.previewLinesBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.dataset.action !== "remove-preview") return;
    if (!state.currentInvoice || state.currentInvoice.status !== "DRAFT") return;
    state.currentInvoice.lines.splice(Number(target.dataset.index), 1);
    renderPreview();
  });

  // Invoice actions (legacy create + summary)
  el.createInvoiceBtn.addEventListener("click", withLoading(el.createInvoiceBtn, "Guardar borrador",   createDraftManual));
  el.createSpecialBtn.addEventListener("click", withLoading(el.createSpecialBtn, "Crear especial",     createSpecial));
  el.interpretBtn.addEventListener("click",     withLoading(el.interpretBtn,     "Interpretar...",     interpretFreeText));
  el.saveDraftBtn.addEventListener("click",     withLoading(el.saveDraftBtn,     "Guardar borrador",   saveDraftEdits));
  el.officializeBtn.addEventListener("click",   withLoading(el.officializeBtn,   "Oficializar",        officializeCurrent));
  el.exportPdfBtn.addEventListener("click",     () => exportCurrent("pdf"));
  el.exportXlsxBtn.addEventListener("click",   () => exportCurrent("xlsx"));

  // Table actions
  bindTableActions(el.recentInvoicesBody);
  bindTableActions(el.historyBody);

  // Client panel toggle
  el.toggleClientFormBtn.addEventListener("click", () => {
    if (!el.clientFormPanel.hidden) {
      resetClientForm();
    } else {
      resetClientForm();
      toggleClientForm(true);
    }
  });

  el.clientsSearch.addEventListener("input", renderClientsTable);
  el.clientForm.addEventListener("submit", withLoading(el.clientFormSubmit, "Guardar cliente", saveClient));
  el.clientFormReset.addEventListener("click", resetClientForm);
  el.reloadClients.addEventListener("click", withLoading(el.reloadClients, "Actualizar", refreshClients));

  el.clientsBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.dataset.action !== "edit-client") return;
    const client = state.clients.find((c) => c.id === target.dataset.id);
    if (client) fillClientForm(client);
  });

  // Invoice list filters (real-time)
  const reRenderList = () => renderTablaFacturas(state.history);
  el.listSearch.addEventListener("input",       reRenderList);
  el.listFilterStatus.addEventListener("change", reRenderList);
  el.listFilterClient.addEventListener("change", reRenderList);
  el.listFilterYear.addEventListener("input",    reRenderList);

  // History filters
  el.applyHistoryFilters.addEventListener("click", withLoading(el.applyHistoryFilters, "Aplicar", loadHistory));
  el.clearHistoryFilters.addEventListener("click", () => {
    el.filterStatus.value = "";
    el.filterYear.value   = "";
    el.filterClient.value = "";
    loadHistory();
  });

  // Quick client modal (legacy)
  el.openClientModal.addEventListener("click", () => el.clientModal.showModal());
  el.closeClientModal.addEventListener("click", () => el.clientModal.close());
  el.quickClientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const res = await api("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name:   el.quickClientName.value.trim(),
          tax_id: el.quickClientTax.value.trim()   || null,
          email:  el.quickClientEmail.value.trim()  || null,
          phone:  el.quickClientPhone.value.trim()  || null,
        }),
      });
      await refreshClients();
      el.clientSelect.value = res.data.id;
      el.clientModal.close();
      el.quickClientForm.reset();
      toast("Cliente creado");
    } catch (error) { handleApiError(error); }
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────

async function bootstrap() {
  clearBanner();
  bindEvents();
  el.invoiceDate.value = todayIso();
  setMode("intelligent");
  el.modeCards.forEach((c) => c.classList.toggle("is-active", c.dataset.mode === "intelligent"));
  renderCreateLines([emptyLineRow()]);
  renderPreview();
  setInvoiceView("list");

  await refreshClients();
  await loadHistory();
}

bootstrap().catch(handleApiError);

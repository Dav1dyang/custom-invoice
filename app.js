const SAMPLE_DATA = {
  orientation: "portrait",
  panelDensity: "standard",
  accent: "#cc3651",
  fromName: "David Yang",
  fromWebsite: "www.davidyang.work",
  fromPhone: "480-787-9710",
  fromAddress: "10 Montieth St, APT 241, Brooklyn, NY 11206",
  clientName: "MORAKANA",
  projectName: "Histolysis: Code & Video",
  clientContacts: `MORAKANA — Sebastián & Tiri
493 Greene Ave, Brooklyn, NY 11216
seb@morakana.com (312) 399-1519 • tiri@morakana.com (917) 456-2956`,
  invoiceNumber: "IN-19",
  invoiceDate: "2025-07-11",
  dueDate: "2025-08-11",
  issuedDate: "2025-06-08",
  completedDate: "2025-07-12",
  invoiceStatus: "Requested",
  currency: "USD",
  paymentDetails:
    "Transfer via Zelle or Venmo — davidyangfinance@gmail.com · 480-787-9710\nACH Transfer — Routing 021000322 · Account 48309130581",
  invoiceNotes: "Included the refund from JLCPCB about the Histolysis order.",
  items: [
    { description: "Check-In · On Site Code Update", quantity: 3, rate: 30 },
    { description: "Work Hour · Zigbee & ESP-NOW Code Test", quantity: 3, rate: 30 },
    { description: "PCB Order · Histolysis V1-1 Tariff Refund", quantity: 1, rate: -7.98 },
    { description: "Check-In · Zigbee & ESP-NOW Test", quantity: 4, rate: 30 },
    { description: "Work Hour · ESP-NOW Code Dev", quantity: 8, rate: 30 },
    { description: "Check-In · ESP-NOW Integration & Video Inspo Discussion", quantity: 6, rate: 30 },
    { description: "Work Hour · Histolysis Video Editing", quantity: 8, rate: 30 },
  ],
};

const STORAGE_KEYS = {
  theme: "invoiceWorkbench.theme",
  accent: "invoiceWorkbench.accent",
};

const currencyFormatters = new Map();
let uploadedLogo = null;

const form = document.getElementById("invoiceForm");
const lineItemsBody = document.getElementById("lineItemsBody");
const addLineItemButton = document.getElementById("addLineItem");
const resetButton = document.getElementById("resetForm");
const downloadButton = document.getElementById("downloadPdf");
const accentPicker = document.getElementById("accentPicker");
const themeSelect = document.getElementById("themeSelect");
const orientationSelect = document.getElementById("orientation");
const panelDensitySelect = document.getElementById("panelDensity");
const currencySelect = document.getElementById("currency");
const logoInput = document.getElementById("logoInput");
const logoPreview = document.getElementById("logoPreview");
const logoPreviewImage = document.getElementById("logoPreviewImage");
const invoicePreview = document.getElementById("invoicePreview");

const fields = [
  "fromName",
  "fromWebsite",
  "fromPhone",
  "fromAddress",
  "clientName",
  "projectName",
  "clientContacts",
  "invoiceNumber",
  "invoiceDate",
  "dueDate",
  "issuedDate",
  "completedDate",
  "invoiceStatus",
  "paymentDetails",
  "invoiceNotes",
];

function getFormatter(currency) {
  if (!currencyFormatters.has(currency)) {
    currencyFormatters.set(
      currency,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
      })
    );
  }
  return currencyFormatters.get(currency);
}

function formatCurrency(value, currency) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return getFormatter(currency).format(value);
}

function formatQuantity(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function newlineToBreaks(str = "") {
  return escapeHtml(str).replace(/\n/g, "<br />");
}

function lightenHex(hex, intensity = 0.35) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const mix = (channel) => Math.round(channel + (255 - channel) * intensity);
  return `#${[mix(r), mix(g), mix(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function applyAccent(accent, persist = true) {
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-strong", lightenHex(accent, 0.55));
  if (persist) {
    localStorage.setItem(STORAGE_KEYS.accent, accent);
  }
}

function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute("data-theme", theme);
  themeSelect.value = theme;
  if (persist) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }
}

function updateLogoPreview() {
  if (uploadedLogo) {
    logoPreviewImage.src = uploadedLogo;
    logoPreview.hidden = false;
  } else {
    logoPreviewImage.removeAttribute("src");
    logoPreview.hidden = true;
  }
}

function createLineItemRow(item = {}) {
  const row = document.createElement("div");
  row.className = "line-items__row";
  row.innerHTML = `
    <textarea class="field__control item-description" placeholder="Describe the task"></textarea>
    <input class="field__control item-qty" type="number" step="0.01" min="0" />
    <input class="field__control item-rate" type="number" step="0.01" />
    <output class="line-items__amount">—</output>
    <button type="button" class="line-items__remove" aria-label="Remove row">×</button>
  `;

  const description = row.querySelector(".item-description");
  const qty = row.querySelector(".item-qty");
  const rate = row.querySelector(".item-rate");

  if (item.description) {
    description.value = item.description;
  }
  if (typeof item.quantity === "number" && !Number.isNaN(item.quantity)) {
    qty.value = item.quantity;
  }
  if (typeof item.rate === "number" && !Number.isNaN(item.rate)) {
    rate.value = item.rate;
  }

  lineItemsBody.appendChild(row);
  updateLineItemRow(row);
}

function updateLineItemRow(row) {
  const qty = parseFloat(row.querySelector(".item-qty").value);
  const rate = parseFloat(row.querySelector(".item-rate").value);
  const amountElement = row.querySelector(".line-items__amount");
  if (Number.isFinite(qty) && Number.isFinite(rate)) {
    amountElement.textContent = formatCurrency(qty * rate, currencySelect.value);
  } else {
    amountElement.textContent = "—";
  }
}

function collectLineItems() {
  return Array.from(lineItemsBody.querySelectorAll(".line-items__row"))
    .map((row) => {
      const description = row.querySelector(".item-description").value.trim();
      const qty = parseFloat(row.querySelector(".item-qty").value);
      const rate = parseFloat(row.querySelector(".item-rate").value);
      const quantity = Number.isFinite(qty) ? qty : 0;
      const price = Number.isFinite(rate) ? rate : 0;
      return {
        description,
        quantity,
        rate: price,
        amount: quantity * price,
      };
    })
    .filter((item) => item.description || item.quantity || item.rate);
}

function getFormData() {
  const data = {
    orientation: orientationSelect.value,
    panelDensity: panelDensitySelect.value,
    currency: currencySelect.value,
    logo: uploadedLogo,
  };

  fields.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      data[id] = element.value;
    }
  });

  const items = collectLineItems();
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    ...data,
    items,
    subtotal,
    total: subtotal,
  };
}

function renderInvoice() {
  const data = getFormData();

  invoicePreview.className = `invoice sheet sheet--${data.orientation}${
    data.panelDensity === "dense" ? " sheet--dense" : ""
  }`;

  const rowsHtml = data.items.length
    ? data.items
        .map(
          (item) => `
            <tr>
              <td>${newlineToBreaks(item.description)}</td>
              <td>${formatQuantity(item.quantity)}</td>
              <td>${formatCurrency(item.rate, data.currency)}</td>
              <td>${formatCurrency(item.amount, data.currency)}</td>
            </tr>
          `
        )
        .join("")
    : '<tr><td colspan="4">No billable work recorded.</td></tr>';

  const paymentDetailsHtml = newlineToBreaks(data.paymentDetails || "");
  const notesHtml = newlineToBreaks(data.invoiceNotes || "");
  const clientContactsHtml = newlineToBreaks(data.clientContacts || "");
  const fromBlockHtml = newlineToBreaks(
    [data.fromName, data.fromAddress, data.fromPhone, data.fromWebsite].filter(Boolean).join("\n")
  );

  const summaryPairs = [
    `Client <strong>${escapeHtml(data.clientName || "")}</strong>`,
    `Number <strong>${escapeHtml(data.invoiceNumber || "")}</strong>`,
    `Issued <strong>${formatDate(data.issuedDate)}</strong>`,
    `Completed <strong>${formatDate(data.completedDate)}</strong>`,
    `Due <strong>${formatDate(data.dueDate)}</strong>`,
    `Amount Due (${escapeHtml(data.currency)}) <strong>${formatCurrency(data.total, data.currency)}</strong>`,
  ]
    .map((entry) => `<span>${entry}</span>`)
    .join("");

  invoicePreview.innerHTML = `
    <header class="invoice__header">
      <div class="invoice__intro">
        <p class="invoice__status">Status · ${escapeHtml(data.invoiceStatus || "Draft")}</p>
        <h1 class="invoice__title">Invoice — ${escapeHtml(data.projectName || "Project")}</h1>
        <div class="invoice__summary">${summaryPairs}</div>
      </div>
      <div class="invoice__meta">
        <span><strong>${escapeHtml(data.fromName || "")}</strong></span>
        <span>${escapeHtml(data.fromWebsite || "")}</span>
        <span>${escapeHtml(data.fromPhone || "")}</span>
        <span>${escapeHtml(data.fromAddress || "")}</span>
      </div>
      ${
        data.logo
          ? `<div class="invoice__logo"><img src="${data.logo}" alt="Logo" /></div>`
          : '<div class="invoice__logo invoice__logo--empty">Logo</div>'
      }
    </header>
    <section class="invoice__addresses">
      <div>
        <h3>From</h3>
        <p>${fromBlockHtml}</p>
      </div>
      <div>
        <h3>Bill To</h3>
        <p>${clientContactsHtml}</p>
      </div>
    </section>
    <section class="invoice__dates">
      <span>Invoice date · ${formatDate(data.invoiceDate)}</span>
      <span>Issued · ${formatDate(data.issuedDate)}</span>
      <span>Completed · ${formatDate(data.completedDate)}</span>
      <span>Due · ${formatDate(data.dueDate)}</span>
    </section>
    <table class="invoice__table">
      <thead>
        <tr>
          <th scope="col">Description</th>
          <th scope="col">Hours / Qty</th>
          <th scope="col">Rate</th>
          <th scope="col">Amount</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="invoice__totals">
      <span>Subtotal<strong>${formatCurrency(data.subtotal, data.currency)}</strong></span>
      <span>Amount due<strong>${formatCurrency(data.total, data.currency)}</strong></span>
    </div>
    <section class="invoice__notes">
      <h4>Payment instructions</h4>
      <p>${paymentDetailsHtml}</p>
      ${data.invoiceNotes ? `<h4>Notes</h4><p>${notesHtml}</p>` : ""}
    </section>
    <footer class="invoice__footer">
      <span>${escapeHtml(data.projectName || "")}</span>
      <span>Prepared by ${escapeHtml(data.fromName || "")} · ${formatDate(data.invoiceDate)}</span>
    </footer>
  `;
}

function updateAllLineItems() {
  Array.from(lineItemsBody.querySelectorAll(".line-items__row")).forEach((row) =>
    updateLineItemRow(row)
  );
}

function handleLineItemInput(event) {
  const row = event.target.closest(".line-items__row");
  if (!row) return;
  updateLineItemRow(row);
  renderInvoice();
}

function handleRemoveLineItem(event) {
  if (!event.target.classList.contains("line-items__remove")) return;
  const row = event.target.closest(".line-items__row");
  if (row) {
    row.remove();
    if (!lineItemsBody.querySelector(".line-items__row")) {
      createLineItemRow();
    }
    renderInvoice();
  }
}

function resetLineItems(items = []) {
  lineItemsBody.innerHTML = "";
  if (!items.length) {
    createLineItemRow();
  } else {
    items.forEach((item) => createLineItemRow(item));
  }
}

function resetFormToSample(options = {}) {
  const { keepAccent = false } = options;
  orientationSelect.value = SAMPLE_DATA.orientation;
  panelDensitySelect.value = SAMPLE_DATA.panelDensity;
  currencySelect.value = SAMPLE_DATA.currency;
  fields.forEach((id) => {
    const element = document.getElementById(id);
    if (element && SAMPLE_DATA[id] !== undefined) {
      element.value = SAMPLE_DATA[id];
    }
  });
  if (!keepAccent) {
    accentPicker.value = SAMPLE_DATA.accent;
    applyAccent(SAMPLE_DATA.accent);
  }
  uploadedLogo = null;
  logoInput.value = "";
  updateLogoPreview();
  resetLineItems(SAMPLE_DATA.items);
}

function restorePreferences() {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const storedAccent = localStorage.getItem(STORAGE_KEYS.accent);
  applyTheme(storedTheme || document.documentElement.getAttribute("data-theme") || "light", false);
  if (storedAccent) {
    accentPicker.value = storedAccent;
    applyAccent(storedAccent, false);
  } else {
    applyAccent(accentPicker.value || SAMPLE_DATA.accent, false);
  }
}

async function downloadInvoicePdf() {
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(invoicePreview, {
    backgroundColor: null,
    scale: 2,
  });
  const imageData = canvas.toDataURL("image/png");
  const orientation = orientationSelect.value === "landscape" ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;
  const marginX = (pageWidth - imgWidth) / 2;
  const marginY = (pageHeight - imgHeight) / 2;

  pdf.addImage(imageData, "PNG", marginX, marginY, imgWidth, imgHeight);
  const filename = `${(document.getElementById("invoiceNumber").value || "invoice")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .toLowerCase()}.pdf`;
  pdf.save(filename);
}

function init() {
  restorePreferences();
  resetFormToSample({ keepAccent: true });
  renderInvoice();

  form.addEventListener("input", (event) => {
    if (event.target.closest(".line-items__row")) return;
    renderInvoice();
  });

  lineItemsBody.addEventListener("input", handleLineItemInput);
  lineItemsBody.addEventListener("change", handleLineItemInput);
  lineItemsBody.addEventListener("click", handleRemoveLineItem);

  addLineItemButton.addEventListener("click", () => {
    createLineItemRow();
    renderInvoice();
  });

  resetButton.addEventListener("click", () => {
    resetFormToSample();
    renderInvoice();
  });

  downloadButton.addEventListener("click", () => {
    downloadInvoicePdf();
  });

  accentPicker.addEventListener("input", (event) => {
    applyAccent(event.target.value);
    renderInvoice();
  });

  themeSelect.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });

  orientationSelect.addEventListener("change", renderInvoice);
  panelDensitySelect.addEventListener("change", renderInvoice);
  currencySelect.addEventListener("change", () => {
    updateAllLineItems();
    renderInvoice();
  });

  logoInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      uploadedLogo = null;
      updateLogoPreview();
      renderInvoice();
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      uploadedLogo = loadEvent.target?.result || null;
      updateLogoPreview();
      renderInvoice();
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", init);

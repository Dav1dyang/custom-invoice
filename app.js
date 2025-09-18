const $ = (selector, ctx = document) => ctx.querySelector(selector)
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector))

const state = {
  logoDataUrl: null,
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0')
  const int = parseInt(value, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function greyFromLightness(lightness) {
  const channel = Math.round(clamp(lightness, 0, 1) * 255)
  const hex = channel.toString(16).padStart(2, '0')
  return `#${hex}${hex}${hex}`
}

function derivePalette(accent) {
  const { r, g, b } = hexToRgb(accent)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const inkStrong = greyFromLightness(clamp(brightness * 0.35 + 0.18, 0.12, 0.32))
  const ink = greyFromLightness(clamp(brightness * 0.45 + 0.28, 0.18, 0.45))
  const inkMuted = greyFromLightness(clamp(brightness * 0.6 + 0.48, 0.45, 0.76))
  const border = greyFromLightness(clamp(brightness * 0.5 + 0.5, 0.55, 0.82))
  const surface = greyFromLightness(clamp(brightness * 0.55 + 0.62, 0.7, 0.92))
  const surfaceStrong = greyFromLightness(clamp(brightness * 0.6 + 0.7, 0.78, 0.96))
  return {
    accent,
    inkStrong,
    ink,
    inkMuted,
    border,
    surface,
    surfaceStrong,
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function buildInvoiceMarkup(data) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const itemsMarkup = data.items
    .map((item) => {
      const qtyDisplay = Number.isInteger(item.qty)
        ? item.qty
        : Number(item.qty).toFixed(2)
      return `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(qtyDisplay)}</td>
          <td>${data.currency} ${currencyFormatter.format(item.rate || 0)}</td>
          <td>${data.currency} ${currencyFormatter.format(item.amount || 0)}</td>
        </tr>`
    })
    .join('')

  const contactMarkup = data.recipient.contact
    .map((line) => escapeHtml(line))
    .join('<br>')

  const paymentMarkup = data.payment
    .map((line) => escapeHtml(line))
    .join('<br>')

  return `
    <div class="invoice__head">
      <div class="invoice__identity">
        ${state.logoDataUrl ? `<img src="${state.logoDataUrl}" alt="Logo" class="invoice__logo">` : ''}
        <div class="invoice__tag">INVOICE</div>
      </div>
      <div class="invoice__meta">
        <strong>${escapeHtml(data.invoiceNumber.toUpperCase())}</strong>
        <span>${formatDate(data.invoiceDate)} → ${formatDate(data.dueDate)}</span><br>
        <span>REV • A</span>
      </div>
    </div>
    <div class="invoice__grid">
      <div class="invoice-panel">
        <div class="invoice-panel__title">Sender</div>
        <div class="invoice-panel__body">
          <strong>${escapeHtml(data.sender.name)}</strong><br>
          ${escapeHtml(data.sender.website)}<br>
          TEL • ${escapeHtml(data.sender.phone)}<br>
          ${escapeHtml(data.sender.address)}
        </div>
      </div>
      <div class="invoice-panel">
        <div class="invoice-panel__title">Recipient</div>
        <div class="invoice-panel__body">
          <strong>${escapeHtml(data.recipient.company)}</strong><br>
          ATTN • ${escapeHtml(data.recipient.attention)}<br>
          ${escapeHtml(data.recipient.address)}
        </div>
      </div>
      <div class="invoice-panel">
        <div class="invoice-panel__title">Contact</div>
        <div class="invoice-panel__body">${contactMarkup || '—'}</div>
      </div>
      <div class="invoice-panel">
        <div class="invoice-panel__title">Specifications</div>
        <div class="invoice-panel__body">
          ISSUED • ${formatDate(data.invoiceDate)}<br>
          DUE • ${formatDate(data.dueDate)}<br>
          CURRENCY • ${escapeHtml(data.currency)}<br>
          TERMS • NET 30
        </div>
      </div>
    </div>
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty/Hrs</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsMarkup || '<tr><td colspan="4">No items entered</td></tr>'}
      </tbody>
    </table>
    <div class="invoice-summary">
      <div class="invoice-panel">
        <div class="invoice-panel__title">Payment instructions</div>
        <div class="invoice-panel__body">${paymentMarkup || '—'}</div>
      </div>
      <div class="invoice-summary__totals">
        <div class="invoice-summary__line"><span>Subtotal</span><span>${data.currency} ${currencyFormatter.format(data.subtotal)}</span></div>
        <div class="invoice-summary__line"><span>Tax (0%)</span><span>${data.currency} ${currencyFormatter.format(0)}</span></div>
        <div class="invoice-summary__total"><span>Total due</span><span>${data.currency} ${currencyFormatter.format(data.subtotal)}</span></div>
        <div class="invoice-summary__note">Due ${formatDate(data.dueDate)}</div>
      </div>
    </div>
  `
}

function collectFormData() {
  const sender = {
    name: $('#fromName').value.trim(),
    website: $('#fromWebsite').value.trim(),
    phone: $('#fromPhone').value.trim(),
    address: $('#fromAddress').value.trim(),
  }

  const recipient = {
    company: $('#toCompany').value.trim(),
    attention: $('#toAttention').value.trim(),
    address: $('#toAddress').value.trim(),
    contact: $('#toContact')
      .value.split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  }

  const payment = $('#paymentInstructions')
    .value.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const items = $$('#itemsBody tr').map((row) => {
    const desc = $('.item-desc', row).value.trim()
    const qty = parseFloat($('.item-qty', row).value) || 0
    const rate = parseFloat($('.item-rate', row).value) || 0
    const amount = qty * rate
    return desc ? { description: desc, qty, rate, amount } : null
  }).filter(Boolean)

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

  return {
    sender,
    recipient,
    payment,
    items,
    subtotal,
    invoiceNumber: $('#invoiceNumber').value.trim() || 'INV-001',
    invoiceDate: $('#invoiceDate').value,
    dueDate: $('#dueDate').value,
    currency: ($('#currency').value.trim() || 'USD').toUpperCase(),
    paperSize: $('#paperSize').value,
    orientation: $('#orientation').value,
  }
}

function applyPalette(element, palette) {
  element.style.setProperty('--accent', palette.accent)
  element.style.setProperty('--ink-strong', palette.inkStrong)
  element.style.setProperty('--ink', palette.ink)
  element.style.setProperty('--ink-muted', palette.inkMuted)
  element.style.setProperty('--border', palette.border)
  element.style.setProperty('--surface', palette.surface)
  element.style.setProperty('--surface-strong', palette.surfaceStrong)
}

function updatePreview() {
  const invoice = $('#invoiceContent')
  const accent = $('#accentColor').value
  const palette = derivePalette(accent)
  const data = collectFormData()
  const style = $('input[name="panelStyle"]:checked').value

  invoice.className = `invoice invoice--${style}`
  applyPalette(invoice, palette)
  invoice.innerHTML = buildInvoiceMarkup(data)
}

function addItemRow({ description = '', qty = '', rate = '' } = {}) {
  const tbody = $('#itemsBody')
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <td><input type="text" class="item-desc" placeholder="Service / Product" value="${escapeHtml(description)}"></td>
    <td><input type="number" class="item-qty" min="0" step="0.01" value="${escapeHtml(qty)}"></td>
    <td><input type="number" class="item-rate" min="0" step="0.01" value="${escapeHtml(rate)}"></td>
    <td><input type="text" class="item-amount" value="0.00" readonly></td>
    <td><button type="button" class="remove-row" aria-label="Remove">×</button></td>
  `

  const qtyInput = $('.item-qty', tr)
  const rateInput = $('.item-rate', tr)
  const amountInput = $('.item-amount', tr)
  const descInput = $('.item-desc', tr)
  const removeBtn = $('.remove-row', tr)

  function recalc() {
    const qty = parseFloat(qtyInput.value) || 0
    const rate = parseFloat(rateInput.value) || 0
    amountInput.value = (qty * rate).toFixed(2)
    updatePreview()
  }

  qtyInput.addEventListener('input', recalc)
  rateInput.addEventListener('input', recalc)
  descInput.addEventListener('input', updatePreview)
  removeBtn.addEventListener('click', () => {
    tr.remove()
    updatePreview()
  })

  tbody.appendChild(tr)
  recalc()
}

function setupThemeToggle() {
  const themeSelect = $('#uiTheme')
  const savedTheme = localStorage.getItem('uiTheme') || 'system'
  document.documentElement.setAttribute('data-theme', savedTheme)
  themeSelect.value = savedTheme
  themeSelect.addEventListener('change', (event) => {
    const theme = event.target.value
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('uiTheme', theme)
  })
}

function setupLogoUpload() {
  const input = $('#logoUpload')
  const preview = $('#logoPreview')
  const previewImage = $('#logoPreviewImage')

  input.addEventListener('change', (event) => {
    const file = event.target.files[0]
    if (!file) {
      state.logoDataUrl = null
      preview.hidden = true
      updatePreview()
      return
    }
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      state.logoDataUrl = loadEvent.target.result
      previewImage.src = state.logoDataUrl
      preview.hidden = false
      updatePreview()
    }
    reader.readAsDataURL(file)
  })
}

function setupListeners() {
  const inputs = [
    '#fromName',
    '#fromWebsite',
    '#fromPhone',
    '#fromAddress',
    '#toCompany',
    '#toAttention',
    '#toAddress',
    '#toContact',
    '#invoiceNumber',
    '#invoiceDate',
    '#dueDate',
    '#currency',
    '#paymentInstructions',
    '#paperSize',
    '#orientation',
    '#accentColor',
  ]

  inputs.forEach((selector) => {
    const element = $(selector)
    const eventName = element.tagName === 'SELECT' ? 'change' : 'input'
    element.addEventListener(eventName, updatePreview)
  })

  $$('input[name="panelStyle"]').forEach((radio) => {
    radio.addEventListener('change', updatePreview)
  })

  $('#refreshPreview').addEventListener('click', updatePreview)

  $('#downloadPdf').addEventListener('click', async () => {
    updatePreview()
    const data = collectFormData()
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({
      orientation: data.orientation,
      unit: 'pt',
      format: data.paperSize === 'a4' ? 'a4' : 'letter',
    })

    const clone = $('#invoiceContent').cloneNode(true)
    clone.style.position = 'absolute'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    document.body.appendChild(clone)

    await doc.html(clone, {
      callback: (docInstance) => {
        docInstance.save(`${data.invoiceNumber || 'invoice'}.pdf`)
      },
      margin: 36,
      autoPaging: 'text',
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
    })

    document.body.removeChild(clone)
  })

  $('#addItem').addEventListener('click', () => {
    addItemRow()
  })
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle()
  setupLogoUpload()
  setupListeners()

  addItemRow({ description: 'Design research and documentation', qty: 10, rate: 145 })
  addItemRow({ description: 'Interface engineering sprint', qty: 18, rate: 155 })
  addItemRow()

  updatePreview()
})

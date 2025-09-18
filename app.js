/* eslint-env browser */
'use strict';

;(function () {
  const $ = (selector, ctx = document) => ctx.querySelector(selector)
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector))

  const state = {
    logoDataUrl: null,
  }

  const DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const DEFAULT_ITEMS = [
    { description: 'Design research and documentation', qty: 10, rate: 145 },
    { description: 'Interface engineering sprint', qty: 18, rate: 155 },
    {},
  ]

  const DEFAULT_THEME = 'system'
  const VALID_THEMES = new Set(['system', 'light', 'dark'])

  const invoiceElement = document.getElementById('invoiceContent')

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function hexToRgb(hex) {
    const clean = String(hex).replace('#', '')
    const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.slice(0, 6)
    const int = Number.parseInt(value || '000000', 16)
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
    const accentRgb = `${r}, ${g}, ${b}`
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const inkStrong = greyFromLightness(clamp(brightness * 0.35 + 0.18, 0.12, 0.32))
    const ink = greyFromLightness(clamp(brightness * 0.45 + 0.28, 0.18, 0.45))
    const inkMuted = greyFromLightness(clamp(brightness * 0.6 + 0.48, 0.45, 0.76))
    const border = greyFromLightness(clamp(brightness * 0.5 + 0.5, 0.55, 0.82))
    const surface = greyFromLightness(clamp(brightness * 0.55 + 0.62, 0.7, 0.92))
    const surfaceStrong = greyFromLightness(clamp(brightness * 0.6 + 0.7, 0.78, 0.96))
    return {
      accent,
      accentRgb,
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

  function parseNumber(value) {
    const parsed = Number.parseFloat(value ?? '')
    return Number.isFinite(parsed) ? parsed : 0
  }

  function roundToCents(value) {
    return Math.round((Number(value) || 0) * 100) / 100
  }

  function formatDecimal(value) {
    return DECIMAL_FORMATTER.format(roundToCents(value))
  }

  function formatCurrency(value, currency) {
    return `${escapeHtml(currency)} ${formatDecimal(value)}`
  }

  function formatQuantity(value) {
    if (!Number.isFinite(value)) return '—'
    return Number.isInteger(value) ? value : roundToCents(value).toFixed(2)
  }

  function formatLinesForHtml(lines) {
    return lines.length ? lines.map((line) => escapeHtml(line)).join('<br>') : '—'
  }

  function calculateLineAmount(qty, rate) {
    return roundToCents(qty * rate)
  }

  function calculateSubtotal(items) {
    return roundToCents(items.reduce((sum, item) => sum + item.amount, 0))
  }

  function buildInvoiceMarkup(data) {
    const itemsMarkup = data.items.length
      ? data.items
          .map(
            (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(formatQuantity(item.qty))}</td>
          <td>${formatCurrency(item.rate, data.currency)}</td>
          <td>${formatCurrency(item.amount, data.currency)}</td>
        </tr>`
          )
          .join('')
      : '<tr><td colspan="4">No items entered</td></tr>'

    const contactMarkup = formatLinesForHtml(data.recipient.contact)
    const paymentMarkup = formatLinesForHtml(data.payment)

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
        <div class="invoice-panel__body">${contactMarkup}</div>
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
        ${itemsMarkup}
      </tbody>
    </table>
    <div class="invoice-summary">
      <div class="invoice-panel">
        <div class="invoice-panel__title">Payment instructions</div>
        <div class="invoice-panel__body">${paymentMarkup}</div>
      </div>
      <div class="invoice-summary__totals">
        <div class="invoice-summary__line"><span>Subtotal</span><span>${formatCurrency(data.subtotal, data.currency)}</span></div>
        <div class="invoice-summary__line"><span>Tax (0%)</span><span>${formatCurrency(0, data.currency)}</span></div>
        <div class="invoice-summary__total"><span>Total due</span><span>${formatCurrency(data.subtotal, data.currency)}</span></div>
        <div class="invoice-summary__note">Due ${formatDate(data.dueDate)}</div>
      </div>
    </div>
  `
  }

  function parseLines(value) {
    return String(value ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }

  function collectFormData() {
    const sender = {
      name: $('#fromName')?.value.trim() || '',
      website: $('#fromWebsite')?.value.trim() || '',
      phone: $('#fromPhone')?.value.trim() || '',
      address: $('#fromAddress')?.value.trim() || '',
    }

    const recipient = {
      company: $('#toCompany')?.value.trim() || '',
      attention: $('#toAttention')?.value.trim() || '',
      address: $('#toAddress')?.value.trim() || '',
      contact: parseLines($('#toContact')?.value),
    }

    const payment = parseLines($('#paymentInstructions')?.value)

    const items = $$('#itemsBody tr')
      .map((row) => {
        const description = $('.item-desc', row)?.value.trim() || ''
        if (!description) return null

        const qty = parseNumber($('.item-qty', row)?.value)
        const rate = parseNumber($('.item-rate', row)?.value)
        const amount = calculateLineAmount(qty, rate)
        return { description, qty, rate, amount }
      })
      .filter(Boolean)

    const subtotal = calculateSubtotal(items)

    return {
      sender,
      recipient,
      payment,
      items,
      subtotal,
      invoiceNumber: $('#invoiceNumber')?.value.trim() || 'INV-001',
      invoiceDate: $('#invoiceDate')?.value || '',
      dueDate: $('#dueDate')?.value || '',
      currency: ($('#currency')?.value.trim() || 'USD').toUpperCase(),
      paperSize: $('#paperSize')?.value || 'letter',
      orientation: $('#orientation')?.value || 'portrait',
    }
  }

  function applyPalette(element, palette) {
    if (!element) return
    element.style.setProperty('--accent', palette.accent)
    element.style.setProperty('--accent-rgb', palette.accentRgb)
    element.style.setProperty('--ink-strong', palette.inkStrong)
    element.style.setProperty('--ink', palette.ink)
    element.style.setProperty('--ink-muted', palette.inkMuted)
    element.style.setProperty('--border', palette.border)
    element.style.setProperty('--surface', palette.surface)
    element.style.setProperty('--surface-strong', palette.surfaceStrong)
  }

  function updateUiAccent(color) {
    document.documentElement.style.setProperty('--ui-accent', color)
    const accentPicker = $('#accentColor')
    if (accentPicker) {
      accentPicker.style.borderColor = color
      accentPicker.style.boxShadow = `0 0 0 1px ${color}`
    }
  }

  function updatePreview() {
    if (!invoiceElement) return

    const accentPicker = $('#accentColor')
    const panelStyle = $('input[name="panelStyle"]:checked')
    if (!accentPicker || !panelStyle) return

    const palette = derivePalette(accentPicker.value)
    const data = collectFormData()

    invoiceElement.className = `invoice invoice--${panelStyle.value}`
    applyPalette(invoiceElement, palette)
    updateUiAccent(palette.accent)
    invoiceElement.innerHTML = buildInvoiceMarkup(data)
  }

  function setAmountValue(amountInput, qty, rate) {
    const amount = calculateLineAmount(qty, rate)
    amountInput.value = roundToCents(amount).toFixed(2)
  }

  function addItemRow({ description = '', qty = '', rate = '' } = {}) {
    const tbody = $('#itemsBody')
    if (!tbody) return

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

    if (!qtyInput || !rateInput || !amountInput || !descInput || !removeBtn) {
      return
    }

    const recalc = () => {
      const qtyValue = parseNumber(qtyInput.value)
      const rateValue = parseNumber(rateInput.value)
      setAmountValue(amountInput, qtyValue, rateValue)
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
    if (!themeSelect) return

    const storedTheme = localStorage.getItem('uiTheme') || ''
    const savedTheme = VALID_THEMES.has(storedTheme) ? storedTheme : DEFAULT_THEME
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
    if (!input || !preview || !previewImage) return

    const clearPreview = () => {
      state.logoDataUrl = null
      previewImage.removeAttribute('src')
      preview.hidden = true
    }

    input.addEventListener('change', (event) => {
      const file = event.target.files?.[0]
      if (!file) {
        clearPreview()
        updatePreview()
        return
      }

      if (!file.type.startsWith('image/')) {
        clearPreview()
        updatePreview()
        return
      }

      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result
        if (typeof result !== 'string') {
          clearPreview()
          updatePreview()
          return
        }

        state.logoDataUrl = result
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
      if (!element) return
      const eventName = element instanceof HTMLSelectElement ? 'change' : 'input'
      element.addEventListener(eventName, updatePreview)
    })

    $$('input[name="panelStyle"]').forEach((radio) => {
      radio.addEventListener('change', updatePreview)
    })

    $('#refreshPreview')?.addEventListener('click', updatePreview)

    $('#downloadPdf')?.addEventListener('click', async () => {
      updatePreview()

      const data = collectFormData()
      const jspdf = window.jspdf
      const jsPDFConstructor = jspdf?.jsPDF
      const html2canvasLib = window.html2canvas
      if (!jsPDFConstructor || !invoiceElement || typeof html2canvasLib !== 'function') {
        console.error('Required PDF export libraries are not available')
        return
      }

      const doc = new jsPDFConstructor({
        orientation: data.orientation,
        unit: 'pt',
        format: data.paperSize === 'a4' ? 'a4' : 'letter',
      })

      const computed = window.getComputedStyle(invoiceElement)
      const cloneWrapper = document.createElement('div')
      cloneWrapper.style.position = 'fixed'
      cloneWrapper.style.left = '0'
      cloneWrapper.style.top = '0'
      cloneWrapper.style.visibility = 'hidden'
      cloneWrapper.style.pointerEvents = 'none'
      cloneWrapper.style.background = computed.backgroundColor || '#ffffff'
      cloneWrapper.style.padding = '0'
      cloneWrapper.style.margin = '0'
      cloneWrapper.style.width = computed.width

      const clone = invoiceElement.cloneNode(true)
      clone.style.margin = '0'
      clone.style.maxWidth = 'none'
      clone.style.width = computed.width
      clone.style.background = computed.backgroundColor || '#ffffff'
      clone.style.padding = computed.padding

      cloneWrapper.appendChild(clone)
      document.body.appendChild(cloneWrapper)

      try {
        if (document.fonts?.ready) {
          try {
            await document.fonts.ready
          } catch (fontError) {
            console.warn('Failed waiting for fonts to load', fontError)
          }
        }

        await new Promise((resolve) => requestAnimationFrame(resolve))

        const canvas = await html2canvasLib(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: clone.scrollWidth,
          windowHeight: clone.scrollHeight,
        })

        const imgData = canvas.toDataURL('image/png')
        const margin = 36
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const availableWidth = pageWidth - margin * 2
        const scale = availableWidth / canvas.width
        const renderWidth = availableWidth
        const renderHeight = canvas.height * scale

        let position = margin
        let heightLeft = renderHeight

        doc.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
        heightLeft -= pageHeight - margin * 2

        while (heightLeft > 0) {
          position = heightLeft - renderHeight + margin
          doc.addPage()
          doc.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
          heightLeft -= pageHeight - margin * 2
        }

        doc.save(`${data.invoiceNumber || 'invoice'}.pdf`)
      } catch (error) {
        console.error('Failed to generate PDF', error)
      } finally {
        document.body.removeChild(cloneWrapper)
      }
    })

    $('#addItem')?.addEventListener('click', () => {
      addItemRow()
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle()
    setupLogoUpload()
    setupListeners()

    DEFAULT_ITEMS.forEach((item) => addItemRow(item))

    updatePreview()
  })
})()

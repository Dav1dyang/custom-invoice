/* TECHNICAL INVOICE GENERATOR - JAVASCRIPT */

/* ----------------------------- THEME ----------------------------- */
const $ = (id) => document.getElementById(id)
const themeSel = $('uiTheme')
const savedTheme = localStorage.getItem('uiTheme') || 'system'
document.documentElement.setAttribute('data-theme', savedTheme)
themeSel.value = savedTheme
themeSel.addEventListener('change', (e) => {
  const t = e.target.value
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('uiTheme', t)
})

/* ----------------------------- LOGO ------------------------------ */
let logoDataUrl = null,
  logoNatural = null
document.getElementById('logoUpload').addEventListener('change', (e) => {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = (ev) => {
    logoDataUrl = ev.target.result
    const img = new Image()
    img.onload = () => {
      logoNatural = {
        w: img.naturalWidth,
        h: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight,
      }
      const pv = document.getElementById('logoPreview')
      pv.src = logoDataUrl
      pv.style.display = 'block'
    }
    img.src = logoDataUrl
  }
  r.readAsDataURL(f)
})

/* ----------------------------- ITEMS ----------------------------- */
function addItem(desc = '', qty = '', rate = '') {
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <td><input class="item-desc" type="text" value="${desc}" placeholder="Service/Product Description"></td>
    <td class="center"><input class="item-qty" type="number" step="0.01" value="${qty}"></td>
    <td class="right"><input class="item-rate" type="number" step="0.01" value="${rate}"></td>
    <td class="right"><input class="item-amt" type="number" step="0.01" value="0.00" readonly></td>
    <td><button type="button" class="rm">×</button></td>`
  document.getElementById('itemsBody').appendChild(tr)
  const qtyEl = tr.querySelector('.item-qty'),
    rateEl = tr.querySelector('.item-rate'),
    amtEl = tr.querySelector('.item-amt'),
    rm = tr.querySelector('.rm')
  function calc() {
    amtEl.value = ((+qtyEl.value || 0) * (+rateEl.value || 0)).toFixed(2)
  }
  qtyEl.addEventListener('input', calc)
  rateEl.addEventListener('input', calc)
  calc()
  rm.onclick = () => tr.remove()
}
addItem()

function getItems() {
  return [...document.querySelectorAll('#itemsBody tr')]
    .map((tr) => {
      const d = tr.querySelector('.item-desc').value.trim()
      const q = tr.querySelector('.item-qty').value
      const r = tr.querySelector('.item-rate').value
      const a = tr.querySelector('.item-amt').value
      return d ? { description: d, qty: q, rate: r, amount: a } : null
    })
    .filter(Boolean)
}

/* ------------------------- STYLE & COLOR ------------------------ */
const styleMode = document.getElementById('styleMode')
const accentColor = document.getElementById('accentColor')
const swAccent = document.getElementById('swAccent')

// Color presets with predefined values
const colorPresets = {
  technical: '#111111',
  blueprint: '#0B4C8C', 
  neon: '#CEFF00',
  orange: '#D45500',
  purple: '#7B2CBF',
  red: '#DC2626'
}

// Update accent color swatch
function updateAccentSwatch() {
  swAccent.style.background = accentColor.value
}

// Set accent color from preset
function setAccentPreset(preset) {
  if (colorPresets[preset]) {
    accentColor.value = colorPresets[preset]
    updateAccentSwatch()
    updatePresetButtons(preset)
  }
}

// Update active preset button styling
function updatePresetButtons(activePreset) {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.remove('active')
    if (btn.dataset.preset === activePreset) {
      btn.classList.add('active')
    }
  })
}

// Calculate relative luminance for color contrast
function getLuminance(hex) {
  const rgb = hexToRgb(hex)
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const bright = Math.max(lum1, lum2)
  const dark = Math.min(lum1, lum2)
  return (bright + 0.05) / (dark + 0.05)
}

// Get appropriate text color for given background (ensures 4.5:1 contrast)
function getReadableTextColor(backgroundColor) {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF')
  const blackContrast = getContrastRatio(backgroundColor, '#000000')
  
  // If white has good contrast (4.5:1+), use white, otherwise use black
  return whiteContrast >= 4.5 ? '#FFFFFF' : '#000000'
}

// Create contrasting text color in same color family as background
function createContrastingTextColor(backgroundColor) {
  const rgb = hexToRgb(backgroundColor)
  const luminance = getLuminance(backgroundColor)
  
  // If background is dark (luminance < 0.5), make text much lighter
  // If background is light (luminance >= 0.5), make text much darker
  if (luminance < 0.5) {
    // Dark background - create very light version of same color
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.8))
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.8))
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.8))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } else {
    // Light background - create much darker version of same color
    const r = Math.round(rgb.r * 0.2)
    const g = Math.round(rgb.g * 0.2)
    const b = Math.round(rgb.b * 0.2)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
}

// Create vibrant fill color for datasheet mode
function createBrightFillColor(accentColor) {
  const rgb = hexToRgb(accentColor)
  
  // Create a bright, vibrant version of the accent color
  // Mix with white for brightness but keep saturation
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.6))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.6))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.6))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Create lighter fill color for line items (more subtle than info boxes)
function createLightTableFillColor(accentColor) {
  const rgb = hexToRgb(accentColor)
  
  // Create a very light version for table rows - more white mixed in
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.85))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.85))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.85))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Get computed colors based on style mode and accent
function getComputedColors() {
  const accent = accentColor.value
  const isOutline = styleMode.value === 'outline'
  
  if (isOutline) {
    // Clean outline style - pure technical drawing with NO fills
    return {
      paper: '#FFFFFF',
      ink: accent,
      text: '#111111', 
      accent: accent,
      fill: '#FFFFFF', // Pure white - no fills for clean technical look
      tableFill: '#FFFFFF', // Pure white for table rows too
      showBorders: true,
      showFill: false, // NO FILLS - clean outline only
      textOnPaper: '#111111',
      textOnFill: '#111111',
      textOnTable: '#111111',
      textOnAccent: getReadableTextColor(accent)
    }
  } else {
    // Filled background style - vibrant datasheet with bright fills
    const brightFillColor = createBrightFillColor(accent)
    const lightTableFillColor = createLightTableFillColor(accent)
    const contrastingTextColor = createContrastingTextColor(accent)
    
    return {
      paper: accent,
      ink: '#111111', // Always black borders for readability
      text: contrastingTextColor, // Contrasting shade of background for text outside boxes
      accent: contrastingTextColor, // Use contrasting color for INVOICE title and text outside boxes
      fill: brightFillColor, // BRIGHT, vibrant fill color for info boxes
      tableFill: lightTableFillColor, // LIGHTER fill for table rows
      showBorders: true,
      showFill: true, // Show bright fills for datasheet look
      textOnPaper: contrastingTextColor, // Contrasting shade on paper background
      textOnFill: '#111111', // Always black on fills for readability - INCLUDING BOX HEADERS
      textOnTable: '#111111', // Always black on table for readability
      textOnAccent: '#111111', // Always black on accent areas
      boxHeaders: '#111111' // NEW: Separate color for headers inside boxes
    }
  }
}

// Update preview colors
function updatePreviewColors() {
  const colors = getComputedColors()
  const preview = document.getElementById('preview')
  const root = document.documentElement
  
  // Set CSS custom properties for preview
  root.style.setProperty('--accent-color', accentColor.value)
  root.style.setProperty('--preview-accent-color', colors.accent) // Accent color for INVOICE title
  root.style.setProperty('--box-header-color', colors.boxHeaders || '#111111') // Black for box headers
  
  // For outline mode: no fills (white), for filled mode: bright fills
  if (styleMode.value === 'outline') {
    root.style.setProperty('--accent-light', '#ffffff') // Pure white for outline
    root.style.setProperty('--table-light', '#ffffff') // Pure white for table
    root.style.setProperty('--lighter-text', '#111111') // Black text for outline
  } else {
    root.style.setProperty('--accent-light', colors.fill) // Bright fill for datasheet
    root.style.setProperty('--table-light', colors.tableFill) // Lighter fill for table
    root.style.setProperty('--lighter-text', colors.textOnPaper) // Contrasting text for outside boxes
  }
  
  // Update preview class
  preview.className = 'preview ' + styleMode.value
}

// Event listeners
accentColor.addEventListener('input', () => {
  updateAccentSwatch()
  updatePreviewColors()
})

styleMode.addEventListener('change', updatePreviewColors)

// Preset button clicks
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setAccentPreset(btn.dataset.preset)
    updatePreviewColors()
  })
})

// Initialize with neon preset
setAccentPreset('neon')
updatePreviewColors()

/* ------------------------- CLIENT TEMPLATES ----------------------- */
const TEMPLATES_KEY = 'invoice_templates'

// Get all saved templates
function getTemplates() {
  const stored = localStorage.getItem(TEMPLATES_KEY)
  return stored ? JSON.parse(stored) : {}
}

// Save templates to localStorage
function saveTemplates(templates) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

// Get current form data as template
function getCurrentTemplateData() {
  return {
    fromName: document.getElementById('fromName').value,
    fromWebsite: document.getElementById('fromWebsite').value,
    fromPhone: document.getElementById('fromPhone').value,
    fromAddress: document.getElementById('fromAddress').value,
    toCompany: document.getElementById('toCompany').value,
    toNames: document.getElementById('toNames').value,
    toAddress: document.getElementById('toAddress').value,
    toContact: document.getElementById('toContact').value,
    paymentInstructions: document.getElementById('paymentInstructions').value,
    currency: document.getElementById('currency').value
  }
}

// Load template data into form
function loadTemplateData(templateData) {
  Object.keys(templateData).forEach(key => {
    const element = document.getElementById(key)
    if (element) {
      element.value = templateData[key]
    }
  })
}

// Update template selector dropdown
function updateTemplateSelector() {
  const selector = document.getElementById('templateSelector')
  const templates = getTemplates()
  
  // Clear existing options except first
  selector.innerHTML = '<option value="">Select a template...</option>'
  
  // Add templates
  Object.keys(templates).forEach(name => {
    const option = document.createElement('option')
    option.value = name
    option.textContent = name
    selector.appendChild(option)
  })
}

// Save current data as template
function saveTemplate() {
  const templateName = document.getElementById('templateName').value.trim()
  
  if (!templateName) {
    alert('Please enter a template name')
    return
  }
  
  const templates = getTemplates()
  templates[templateName] = getCurrentTemplateData()
  saveTemplates(templates)
  
  updateTemplateSelector()
  document.getElementById('templateName').value = ''
  alert(`Template "${templateName}" saved successfully!`)
}

// Load selected template
function loadSelectedTemplate() {
  const selector = document.getElementById('templateSelector')
  const templateName = selector.value
  
  if (!templateName) {
    alert('Please select a template to load')
    return
  }
  
  const templates = getTemplates()
  if (templates[templateName]) {
    loadTemplateData(templates[templateName])
    alert(`Template "${templateName}" loaded successfully!`)
  } else {
    alert('Template not found')
  }
}

// Delete selected template
function deleteSelectedTemplate() {
  const selector = document.getElementById('templateSelector')
  const templateName = selector.value
  
  if (!templateName) {
    alert('Please select a template to delete')
    return
  }
  
  if (confirm(`Are you sure you want to delete template "${templateName}"?`)) {
    const templates = getTemplates()
    delete templates[templateName]
    saveTemplates(templates)
    updateTemplateSelector()
    alert(`Template "${templateName}" deleted successfully!`)
  }
}

// Show load template dialog (alternative method)
function loadTemplateDialog() {
  const templates = getTemplates()
  const templateNames = Object.keys(templates)
  
  if (templateNames.length === 0) {
    alert('No templates saved yet')
    return
  }
  
  const selected = prompt(`Available templates:\n${templateNames.join('\n')}\n\nEnter template name to load:`)
  
  if (selected && templates[selected]) {
    loadTemplateData(templates[selected])
    alert(`Template "${selected}" loaded successfully!`)
  } else if (selected) {
    alert('Template not found')
  }
}

// Initialize template selector on page load
updateTemplateSelector()

/* ------------------------- CSV IMPORT ----------------------------- */

// Parse CSV text with auto-detection of delimiter
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return []
  
  // Auto-detect delimiter (comma, tab, semicolon)
  const firstLine = lines[0]
  let delimiter = ','
  if (firstLine.includes('\t')) delimiter = '\t'
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';'
  
  const result = []
  
  lines.forEach((line, index) => {
    if (!line.trim()) return
    
    const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''))
    
    // Skip header row if it looks like headers
    if (index === 0 && (
      values[0]?.toLowerCase().includes('description') ||
      values[0]?.toLowerCase().includes('item') ||
      values[0]?.toLowerCase().includes('product')
    )) {
      return
    }
    
    if (values.length >= 3) {
      const description = values[0] || ''
      const qty = parseFloat(values[1]) || 1
      const rate = parseFloat(values[2]) || 0
      
      if (description) {
        result.push({
          description,
          qty: qty.toString(),
          rate: rate.toString()
        })
      }
    } else if (values.length === 2) {
      // Handle 2-column format (description, amount)
      const description = values[0] || ''
      const amount = parseFloat(values[1]) || 0
      
      if (description) {
        result.push({
          description,
          qty: '1',
          rate: amount.toString()
        })
      }
    }
  })
  
  return result
}

// Clear all existing items
function clearAllItems() {
  if (confirm('Are you sure you want to clear all line items?')) {
    document.getElementById('itemsBody').innerHTML = ''
    addItem() // Add one empty item
  }
}

// Import items from parsed data
function importItems(items, replace = true) {
  if (items.length === 0) {
    alert('No valid items found in the data. Expected format: Description, Quantity, Rate')
    return
  }
  
  if (replace) {
    document.getElementById('itemsBody').innerHTML = ''
  }
  
  items.forEach(item => {
    addItem(item.description, item.qty, item.rate)
  })
  
  alert(`Successfully imported ${items.length} items!`)
}

// Import from file
function importFromFile() {
  const fileInput = document.getElementById('csvFileInput')
  const file = fileInput.files[0]
  
  if (!file) {
    alert('Please select a file to import')
    return
  }
  
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const text = e.target.result
      const items = parseCSV(text)
      importItems(items)
      fileInput.value = '' // Clear file input
    } catch (error) {
      alert('Error reading file: ' + error.message)
    }
  }
  
  reader.readAsText(file)
}

// Import from pasted text
function importFromPaste() {
  const textarea = document.getElementById('csvPasteArea')
  const text = textarea.value.trim()
  
  if (!text) {
    alert('Please paste some CSV data first')
    return
  }
  
  try {
    const items = parseCSV(text)
    importItems(items)
    textarea.value = '' // Clear textarea
  } catch (error) {
    alert('Error parsing CSV data: ' + error.message)
  }
}

/* ---------------------------- PREVIEW ---------------------------- */
function fmtDate(v) {
  const d = v ? new Date(v) : new Date()
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(/ /g, '-')
}

function renderPreview() {
  const fmtMoney = (value) => `$${(+value || 0).toFixed(2)}`
  const invoiceNumber = $('invoiceNumber').value
  const currencyValue = $('currency').value
  const fromNameVal = $('fromName').value
  const fromWebsiteVal = $('fromWebsite').value
  const fromPhoneVal = $('fromPhone').value
  const fromAddressVal = $('fromAddress').value
  const toCompanyVal = $('toCompany').value
  const toNamesVal = $('toNames').value
  const toAddressVal = $('toAddress').value
  const toContactVal = $('toContact').value
  const paymentInstructionsVal = $('paymentInstructions').value
  const invoiceDateVal = $('invoiceDate').value
  const dueDateVal = $('dueDate').value
  const items = getItems()
  const subtotal = items.reduce(
    (sum, item) => sum + (+item.amount || 0),
    0
  )
  const rows = items
    .map(
      (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="invoice-cell--center">${item.qty}</td>
          <td class="invoice-cell--right">${fmtMoney(item.rate)}</td>
          <td class="invoice-cell--right invoice-cell--em">${fmtMoney(
            item.amount
          )}</td>
        </tr>`
    )
    .join('')
  const logoHTML = logoDataUrl
    ? `<img class="invoice-logo" src="${logoDataUrl}" alt="Logo">`
    : ''
  $('invoiceContent').innerHTML = `
    <div class="invoice-head">
      ${logoHTML}
      <div class="invoice-head__meta">
        <div class="invoice-head__title">INVOICE</div>
        <div class="invoice-head__number">${invoiceNumber}</div>
        <div>REV: A</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-grid">
        <div class="invoice-panel">
          <div class="invoice-panel__title">FROM</div>
          <div><strong>${fromNameVal}</strong><br>${fromWebsiteVal}<br>TEL: ${fromPhoneVal}<br>${fromAddressVal}</div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-panel__title">BILL TO</div>
          <div><strong>${toCompanyVal}</strong><br>ATTN: ${toNamesVal}<br>${toAddressVal}</div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-panel__title">RECIPIENT CONTACT</div>
          <div class="invoice-panel__pre">${toContactVal}</div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-panel__title">SPECIFICATIONS</div>
          <div>ISSUED: ${fmtDate(invoiceDateVal)}<br>DUE: ${fmtDate(
    dueDateVal
  )}<br>CURRENCY: ${currencyValue}<br>TERMS: NET 30</div>
        </div>
      </div>
      <table class="invoice-table">
        <colgroup><col /><col /><col /><col /></colgroup>
        <thead>
          <tr>
            <th>DESCRIPTION</th>
            <th class="invoice-cell--center">QTY/HRS</th>
            <th class="invoice-cell--right">RATE</th>
            <th class="invoice-cell--right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="invoice-summary">
        <div class="invoice-panel">
          <div class="invoice-panel__title">PAYMENT INSTRUCTIONS</div>
          <div class="invoice-panel__pre">${paymentInstructionsVal}</div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-panel__title">TOTAL</div>
          <div class="invoice-summary__totals">
            <div class="invoice-summary__line"><span>SUBTOTAL:</span><span>${fmtMoney(
              subtotal
            )}</span></div>
            <div class="invoice-summary__line"><span>TAX (0%):</span><span>$0.00</span></div>
            <div class="invoice-summary__total"><span>TOTAL (${currencyValue}):</span><span>${fmtMoney(
    subtotal
  )}</span></div>
          </div>
        </div>
      </div>
    </div>`
  $('preview').style.display = 'block'
  document
    .getElementById('preview')
    .scrollIntoView({ behavior: 'smooth' })
}

/* -------------------------- PDF FONTS --------------------------- */
let fontsReady = null
function toB64(ab) {
  let s = '',
    b = new Uint8Array(ab),
    chunk = 0x8000
  for (let i = 0; i < b.length; i += chunk)
    s += String.fromCharCode.apply(null, b.subarray(i, i + chunk))
  return btoa(s)
}

async function fetchFirst(urls, timeoutMs = 8000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  for (const u of urls) {
    try {
      const res = await fetch(u, {
        signal: controller.signal,
        cache: 'force-cache',
        mode: 'cors',
      })
      if (res.ok) {
        clearTimeout(t)
        return await res.arrayBuffer()
      }
    } catch (_) {}
  }
  clearTimeout(t)
  throw new Error('All font URLs failed')
}

const FONT_TARGETS = {
  hdr: {
    name: 'RubikBold',
    vfs: 'RubikBold.ttf',
    input: 'fontHdr',
    status: 'fontHdrStatus',
    localPath: './fonts/Rubik/static/Rubik-Bold.ttf',
    urls: [
      'https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4iFVUUzdYPFkaVNA6w.ttf',
      'https://cdn.jsdelivr.net/npm/@fontsource/rubik@5.0.0/files/rubik-latin-700-normal.ttf',
      'https://github.com/google/fonts/raw/main/ofl/rubik/static/Rubik-Bold.ttf',
    ],
  },
  body: {
    name: 'DMMono-Light',
    vfs: 'DMMono-Light.ttf',
    input: 'fontBody',
    status: 'fontBodyStatus',
    localPath: './fonts/DM_Mono/DMMono-Light.ttf',
    urls: [
      'https://fonts.gstatic.com/s/dmmono/v14/aFTU7PB1QTsUX8KYthqQBK0ReMw.ttf',
      'https://cdn.jsdelivr.net/npm/@fontsource/dm-mono@5.0.0/files/dm-mono-latin-300-normal.ttf',
      'https://github.com/googlefonts/dm-mono/raw/main/fonts/ttf/DMMono-Light.ttf',
    ],
  },
}

window.__pdfFonts = { hdr: null, body: null }

function setStatus(which, cls, msg) {
  const el = document.getElementById(FONT_TARGETS[which].status)
  if (el) el.innerHTML = `${msg} <span class="status-dot ${cls}"></span>`
}

async function loadLocalFont(which, file) {
  const ab = await file.arrayBuffer()
  window.__pdfFonts[which] = toB64(ab)
  setStatus(which, 'ok', 'Loaded local TTF')
}

async function loadLocalFontFromPath(which, path) {
  try {
    const response = await fetch(path, { cache: 'force-cache' })
    if (response.ok) {
      const ab = await response.arrayBuffer()
      window.__pdfFonts[which] = toB64(ab)
      setStatus(which, 'ok', 'Loaded from local')
      return true
    }
  } catch (error) {
    console.warn(`Failed to load local font from ${path}:`, error)
  }
  return false
}

Object.keys(FONT_TARGETS).forEach((k) => {
  document
    .getElementById(FONT_TARGETS[k].input)
    .addEventListener('change', (e) => {
      const f = e.target.files?.[0]
      if (f) loadLocalFont(k, f)
    })
})

async function ensureFonts() {
  if (fontsReady) return fontsReady

  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF library not loaded')
  }

  const { jsPDF } = window.jspdf
  async function addFromB64(name, vfs, b64) {
    if (!jsPDF.API || typeof jsPDF.API.addFileToVFS !== 'function') {
      throw new Error('jsPDF API not properly initialized')
    }
    jsPDF.API.addFileToVFS(vfs, b64)
    jsPDF.API.addFont(vfs, name, 'normal')
  }
  async function addFromUrls(name, vfs, urls) {
    if (!jsPDF.API || typeof jsPDF.API.addFileToVFS !== 'function') {
      throw new Error('jsPDF API not properly initialized')
    }
    const ab = await fetchFirst(urls)
    jsPDF.API.addFileToVFS(vfs, toB64(ab))
    jsPDF.API.addFont(vfs, name, 'normal')
  }
  fontsReady = (async () => {
    try {
      // Try header font: user upload -> local file -> CDN
      if (window.__pdfFonts.hdr) {
        await addFromB64(
          FONT_TARGETS.hdr.name,
          FONT_TARGETS.hdr.vfs,
          window.__pdfFonts.hdr
        )
        setStatus('hdr', 'ok', 'Embedded')
      } else if (await loadLocalFontFromPath('hdr', FONT_TARGETS.hdr.localPath)) {
        await addFromB64(
          FONT_TARGETS.hdr.name,
          FONT_TARGETS.hdr.vfs,
          window.__pdfFonts.hdr
        )
      } else {
        await addFromUrls(
          FONT_TARGETS.hdr.name,
          FONT_TARGETS.hdr.vfs,
          FONT_TARGETS.hdr.urls
        )
        setStatus('hdr', 'ok', 'CDN loaded')
      }

      // Try body font: user upload -> local file -> CDN
      if (window.__pdfFonts.body) {
        await addFromB64(
          FONT_TARGETS.body.name,
          FONT_TARGETS.body.vfs,
          window.__pdfFonts.body
        )
        setStatus('body', 'ok', 'Embedded')
      } else if (await loadLocalFontFromPath('body', FONT_TARGETS.body.localPath)) {
        await addFromB64(
          FONT_TARGETS.body.name,
          FONT_TARGETS.body.vfs,
          window.__pdfFonts.body
        )
      } else {
        await addFromUrls(
          FONT_TARGETS.body.name,
          FONT_TARGETS.body.vfs,
          FONT_TARGETS.body.urls
        )
        setStatus('body', 'ok', 'CDN loaded')
      }

      return {
        hdr: FONT_TARGETS.hdr.name,
        body: FONT_TARGETS.body.name,
        ok: true,
      }
    } catch (e) {
      console.warn('Custom fonts failed, falling back.', e)
      setStatus('hdr', 'err', 'Fallback')
      setStatus('body', 'err', 'Fallback')
      return { hdr: 'courier', body: 'helvetica', ok: false }
    }
  })()
  return fontsReady
}

/* ------------------------ PDF UTILITIES ------------------------- */
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function fmtDatePDF(v) {
  const d = v ? new Date(v) : new Date()
  const M = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]
  return `${String(d.getDate()).padStart(2, '0')}-${
    M[d.getMonth()]
  }-${d.getFullYear()}`
}

/* --------------------------- PDF MAIN --------------------------- */
async function downloadPDF() {
  const { jsPDF } = window.jspdf
  const fonts = await ensureFonts()

  // Data
  const fromName = document.getElementById('fromName').value
  const fromWebsite = document.getElementById('fromWebsite').value
  const fromPhone = document.getElementById('fromPhone').value
  const fromAddress = document.getElementById('fromAddress').value
  const toCompany = document.getElementById('toCompany').value
  const toNames = document.getElementById('toNames').value
  const toAddress = document.getElementById('toAddress').value
  const toContact = document.getElementById('toContact').value
  const invoiceNumber = document.getElementById('invoiceNumber').value
  const invoiceDate = fmtDatePDF(
    document.getElementById('invoiceDate').value
  )
  const dueDate = fmtDatePDF(document.getElementById('dueDate').value)
  const currency = document.getElementById('currency').value
  const paymentInstructions = document.getElementById(
    'paymentInstructions'
  ).value
  const items = getItems()

  const size = document.getElementById('paperSize').value
  const orientation =
    document.getElementById('orientation').value === 'landscape'
      ? 'l'
      : 'p'
  
  // Get computed colors based on current style mode
  const colors = getComputedColors()
  const paperRGB = hexToRgb(colors.paper)
  const inkRGB = hexToRgb(colors.ink)
  const textRGB = hexToRgb(colors.textOnPaper)
  const accRGB = hexToRgb(colors.accent)
  const boxRGB = hexToRgb(colors.fill)
  const boxTextRGB = hexToRgb(colors.textOnFill)
  const tableRGB = hexToRgb(colors.tableFill)
  const tableTextRGB = hexToRgb(colors.textOnTable)
  const showB = colors.showBorders
  const showF = colors.showFill
  const boxAlpha = showF ? 1.0 : 0 // Use full opacity for distinct boxes

  const doc = new jsPDF({ orientation, unit: 'mm', format: size })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Paper
  doc.setFillColor(paperRGB.r, paperRGB.g, paperRGB.b)
  doc.rect(0, 0, pageW, pageH, 'F')

  // Colors & stroke
  doc.setDrawColor(inkRGB.r, inkRGB.g, inkRGB.b)
  doc.setTextColor(textRGB.r, textRGB.g, textRGB.b)
  doc.setLineWidth(0.1)

  const margin = 10,
    contentW = pageW - 2 * margin

  // Header — logo keeps aspect
  if (logoDataUrl) {
    const maxW = 35,
      maxH = 15
    let w = maxW,
      h = maxH
    if (logoNatural && logoNatural.w && logoNatural.h) {
      const r = logoNatural.w / logoNatural.h
      if (maxW / maxH > r) {
        h = maxH
        w = h * r
      } else {
        w = maxW
        h = w / r
      }
    }
    doc.addImage(logoDataUrl, 'PNG', margin, 15, w, h)
  }
  doc.setFont(fonts.hdr, fonts.ok ? 'normal' : 'bold')
  doc.setTextColor(accRGB.r, accRGB.g, accRGB.b)
  doc.setFontSize(13)
  doc.text('INVOICE', pageW - margin, 20, { align: 'right' })
  // Keep accent color (black) for all header elements for consistency
  doc.setFontSize(8)
  doc.text(invoiceNumber.toUpperCase(), pageW - margin, 25, {
    align: 'right',
  })
  doc.text('REV: A', pageW - margin, 29, { align: 'right' })
  if (showB) doc.line(margin, 35, pageW - margin, 35)

  // Bottom-heavy layout math
  const bottomMargin = 10,
    dataGridH = 25,
    itemsHeaderH = 8,
    rowH = 7,
    spacer = 4,
    paymentH = 30
  const minTopSpace = pageH * 0.45
  const yPaymentTop = pageH - bottomMargin - paymentH
  const yItemsBottom = yPaymentTop - spacer
  const usableHeight = yItemsBottom - minTopSpace
  const maxRowsFit = Math.max(
    0,
    Math.floor((usableHeight - dataGridH - spacer - itemsHeaderH) / rowH)
  )
  const rows = Math.max(0, Math.min(items.length, maxRowsFit))
  const yDataTop =
    yItemsBottom - (itemsHeaderH + rows * rowH + spacer + dataGridH)
  const yItemsTop = yDataTop + dataGridH + spacer

  // Spec grid with optional fill/borders
  const colW = contentW / 4
  if (showF && boxAlpha > 0) {
    doc.setFillColor(boxRGB.r, boxRGB.g, boxRGB.b)
    doc.setGState(new doc.GState({ opacity: boxAlpha }))
    doc.rect(margin, yDataTop, contentW, dataGridH, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))
  }
  if (showB) {
    doc.rect(margin, yDataTop, contentW, dataGridH)
    for (let i = 1; i < 4; i++) {
      const x = margin + i * colW
      doc.line(x, yDataTop, x, yDataTop + dataGridH)
    }
  }

  // Grid headers (ALL CAPS) - use black for headers inside boxes
  doc.setFont(fonts.hdr, fonts.ok ? 'normal' : 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b) // Use box text color (black)
  doc.setFontSize(7.5)
  doc.text('FROM', margin + 2, yDataTop + 4)
  doc.text('BILL TO', margin + colW + 2, yDataTop + 4)
  doc.text('RECIPIENT CONTACT', margin + 2 * colW + 2, yDataTop + 4)
  doc.text('SPECIFICATIONS', margin + 3 * colW + 2, yDataTop + 4)

  // Grid body (thin mono, slightly larger) - use box text color for content in boxes
  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(8)
  const pad = 2

  // sender
  let x0 = margin,
    y0 = yDataTop + 8
  doc.text(fromName, x0 + pad, y0)
  y0 += 3
  doc.text(fromWebsite, x0 + pad, y0)
  y0 += 3
  doc.text('TEL: ' + fromPhone, x0 + pad, y0)
  y0 += 3
  doc.text(doc.splitTextToSize(fromAddress, colW - 2 * pad), x0 + pad, y0)

  // recipient
  x0 = margin + colW
  y0 = yDataTop + 8
  doc.text(toCompany, x0 + pad, y0)
  y0 += 3
  doc.text('ATTN: ' + toNames, x0 + pad, y0)
  y0 += 3
  doc.text(doc.splitTextToSize(toAddress, colW - 2 * pad), x0 + pad, y0)

  // contact
  x0 = margin + 2 * colW
  y0 = yDataTop + 8
  toContact
    .split('\n')
    .map((s) => doc.splitTextToSize(s, colW - 2 * pad))
    .flat()
    .forEach((L) => {
      if (y0 < yDataTop + dataGridH - 2) {
        doc.text(L, x0 + pad, y0)
        y0 += 3
      }
    })

  // specs
  x0 = margin + 3 * colW
  y0 = yDataTop + 8
  doc.text('ISSUED: ' + invoiceDate, x0 + pad, y0)
  y0 += 3
  doc.text('DUE: ' + dueDate, x0 + pad, y0)
  y0 += 3
  doc.text('CURRENCY: ' + currency, x0 + pad, y0)
  y0 += 3
  doc.text('TERMS: NET 30', x0 + pad, y0)

  // Items table
  const descW = contentW * 0.5,
    qtyW = contentW * 0.15,
    rateW = contentW * 0.15,
    amtW = contentW * 0.2
  const xDesc = margin,
    xQty = margin + descW,
    xRate = xQty + qtyW,
    xAmt = xRate + rateW
  const tableH = itemsHeaderH + rows * rowH

  if (showB) {
    doc.rect(margin, yItemsTop, contentW, tableH)
    doc.line(xQty, yItemsTop, xQty, yItemsTop + tableH)
    doc.line(xRate, yItemsTop, xRate, yItemsTop + tableH)
    doc.line(xAmt, yItemsTop, xAmt, yItemsTop + tableH)
  }
  if (showF && boxAlpha > 0) {
    doc.setFillColor(boxRGB.r, boxRGB.g, boxRGB.b)
    doc.setGState(new doc.GState({ opacity: boxAlpha }))
    doc.rect(margin, yItemsTop, contentW, itemsHeaderH, 'F') // header band
    doc.setGState(new doc.GState({ opacity: 1 }))
  }

  doc.setFont(fonts.hdr, fonts.ok ? 'normal' : 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b) // Use black for table headers inside boxes
  doc.setFontSize(7.5)
  const hY = yItemsTop + 5
  doc.text('DESCRIPTION', xDesc + 2, hY)
  doc.text('QTY/HRS', xQty + 2, hY)
  doc.text('RATE', xRate + 2, hY)
  doc.text('AMOUNT', xAmt + 2, hY)
  if (showB)
    doc.line(
      margin,
      yItemsTop + itemsHeaderH,
      margin + contentW,
      yItemsTop + itemsHeaderH
    )

  // rows - use table-specific colors for better readability
  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(tableTextRGB.r, tableTextRGB.g, tableTextRGB.b)
  doc.setFontSize(8)
  let y = yItemsTop + itemsHeaderH,
    subtotal = 0
  for (let i = 0; i < rows; i++) {
    const it = items[i]
    
    // Add lighter background fill for table rows in filled mode
    if (showF && boxAlpha > 0) {
      doc.setFillColor(tableRGB.r, tableRGB.g, tableRGB.b)
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.rect(margin, y, contentW, rowH, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
    }
    
    const rate = '$' + (+it.rate || 0).toFixed(2)
    const amtVal = +it.amount || 0
    const amt = '$' + amtVal.toFixed(2)
    subtotal += amtVal
    const dLine = doc.splitTextToSize(it.description, descW - 4)[0] || ''
    doc.text(dLine, xDesc + 2, y + 4)
    doc.text(String(it.qty || ''), xQty + 2, y + 4)
    doc.text(rate, xRate + 2, y + 4)
    doc.text(amt, xAmt + amtW - 2, y + 4, { align: 'right' })
    y += rowH
    if (showB && i < rows - 1) doc.line(margin, y, margin + contentW, y)
  }

  // Payment + totals
  const splitW = contentW * 0.66,
    xSplit = margin + splitW,
    yPayTop = yPaymentTop
  if (showF && boxAlpha > 0) {
    doc.setFillColor(boxRGB.r, boxRGB.g, boxRGB.b)
    doc.setGState(new doc.GState({ opacity: boxAlpha }))
    doc.rect(margin, yPayTop, contentW, paymentH, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))
  }
  if (showB) {
    doc.rect(margin, yPayTop, contentW, paymentH)
    doc.line(xSplit, yPayTop, xSplit, yPayTop + paymentH)
  }

  doc.setFont(fonts.hdr, fonts.ok ? 'normal' : 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b) // Use black for headers inside boxes
  doc.setFontSize(7.5)
  doc.text('PAYMENT INSTRUCTIONS', margin + 2, yPayTop + 4)

  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(8)
  let py = yPayTop + 8
  paymentInstructions.split('\n').forEach((line) => {
    const lines = doc.splitTextToSize(line, splitW - 4)
    lines.forEach((L) => {
      if (py < yPayTop + paymentH - 2) {
        doc.text(L, margin + 2, py)
        py += 3
      }
    })
  })

  doc.setFont(fonts.hdr, fonts.ok ? 'normal' : 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b) // Use black for headers inside boxes
  doc.setFontSize(7.5)
  doc.text('TOTAL', xSplit + 2, yPayTop + 4)

  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(8)
  const rightX = margin + contentW - 2
  let ty = yPayTop + 10
  doc.text('SUBTOTAL:', xSplit + 2, ty)
  doc.text('$' + subtotal.toFixed(2), rightX, ty, { align: 'right' })
  ty += 4
  doc.text('TAX (0%):', xSplit + 2, ty)
  doc.text('$0.00', rightX, ty, { align: 'right' })
  ty += 4
  if (showB) doc.line(xSplit + 2, ty + 1, margin + contentW - 2, ty + 1)
  ty += 6
  doc.setFont(fonts.body, 'bold')
  doc.setFontSize(9)
  doc.text('TOTAL (' + currency + '): ', xSplit + 2, ty)
  doc.text('$' + subtotal.toFixed(2), rightX, ty, { align: 'right' })

  doc.save(`invoice-${invoiceNumber}.pdf`)
}
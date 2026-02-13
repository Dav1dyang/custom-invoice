/* INVOICE TOOL - JAVASCRIPT */

/* ----------------------------- UTILITIES ----------------------------- */
const $ = (id) => document.getElementById(id)

// Generate abbreviation from company name
function generateAbbreviation(name) {
  if (!name || !name.trim()) return ''

  // Remove common words
  const skipWords = ['the', 'a', 'an', 'and', 'of', 'for', 'to', 'in', 'on', 'at', 'foundation']

  // Split into words, filter stop words, take first letter
  const words = name.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
    .split(/\s+/)
    .filter(word => word.length > 0 && !skipWords.includes(word.toLowerCase()))

  // Take first letter of each significant word, max 6 letters
  return words.map(w => w[0]).join('').slice(0, 6)
}

/* ----------------------------- THEME ----------------------------- */
let currentTheme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-theme', currentTheme)
updateThemeIcon()

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', currentTheme)
  localStorage.setItem('theme', currentTheme)
  updateThemeIcon()
}

function updateThemeIcon() {
  const themeIcon = document.querySelector('.theme-icon')
  const downloadIcon = document.querySelector('.download-icon')
  if (themeIcon) {
    themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️'
  }
  if (downloadIcon) {
    downloadIcon.textContent = currentTheme === 'light' ? '⬇' : '⬇'
  }
}

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
// Global state for drag and drop
let draggedRow = null

function addItem(desc = '', qty = '', rate = '', type = '') {
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <td class="drag-handle"><span class="drag-icon">⋮⋮</span></td>
    <td class="type-cell"><input class="item-type" type="text" value="${type}" placeholder="Type..." list="typeOptions" /></td>
    <td><input class="item-desc" type="text" value="${desc}" placeholder="Description..."></td>
    <td class="center"><input class="item-qty" type="number" step="0.01" value="${qty}" placeholder="Qty"></td>
    <td class="right"><input class="item-rate" type="number" step="0.01" value="${rate}" placeholder="Rate"></td>
    <td class="right"><input class="item-amt" type="number" step="0.01" value="0.00" readonly></td>
    <td><button type="button" class="rm">×</button></td>`
  document.getElementById('itemsBody').appendChild(tr)
  const typeEl = tr.querySelector('.item-type'),
    qtyEl = tr.querySelector('.item-qty'),
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

  // Enable drag and drop for reordering
  tr.setAttribute('draggable', 'true')
  setupDragAndDrop(tr)

  // Track if drag should be allowed (only from drag handle)
  const dragHandle = tr.querySelector('.drag-handle')

  dragHandle.addEventListener('mousedown', () => {
    tr.dataset.allowDrag = 'true'
  })

  tr.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.drag-handle')) {
      tr.dataset.allowDrag = 'false'
    }
  })
}
addItem()

function getItems() {
  return [...document.querySelectorAll('#itemsBody tr')]
    .map((tr) => {
      const t = tr.querySelector('.item-type')?.value.trim() || ''
      const d = tr.querySelector('.item-desc').value.trim()
      const q = tr.querySelector('.item-qty').value
      const r = tr.querySelector('.item-rate').value
      const a = tr.querySelector('.item-amt').value
      return d ? { type: t, description: d, qty: q, rate: r, amount: a } : null
    })
    .filter(Boolean)
}

// Check if any items have types filled
function hasAnyTypes(items) {
  return items.some(item => item.type && item.type.trim())
}

// Get notes position (above or below items)
function getNotesPosition() {
  const selected = document.querySelector('input[name="notesPosition"]:checked')
  return selected ? selected.value : 'above'  // Default: above
}

/* ----------------------------- DRAG AND DROP ----------------------------- */
// Setup drag and drop for a table row
function setupDragAndDrop(row) {
  row.addEventListener('dragstart', handleDragStart)
  row.addEventListener('dragover', handleDragOver)
  row.addEventListener('drop', handleDrop)
  row.addEventListener('dragend', handleDragEnd)
  row.addEventListener('dragenter', handleDragEnter)
  row.addEventListener('dragleave', handleDragLeave)
}

function handleDragStart(e) {
  // Only allow drag if started from drag handle
  if (this.dataset.allowDrag !== 'true') {
    e.preventDefault()
    return false
  }

  draggedRow = this
  this.classList.add('dragging')
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/html', this.innerHTML)
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault()
  }
  e.dataTransfer.dropEffect = 'move'
  return false
}

function handleDragEnter(e) {
  if (this !== draggedRow) {
    this.classList.add('drag-over')
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over')
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation()
  }

  if (draggedRow !== this) {
    const tbody = this.parentNode

    // Determine drop position (above or below target row)
    const rect = this.getBoundingClientRect()
    const offset = e.clientY - rect.top
    const middle = rect.height / 2

    if (offset < middle) {
      // Insert before target row
      tbody.insertBefore(draggedRow, this)
    } else {
      // Insert after target row
      tbody.insertBefore(draggedRow, this.nextSibling)
    }
  }

  this.classList.remove('drag-over')
  return false
}

function handleDragEnd(e) {
  this.classList.remove('dragging')
  this.dataset.allowDrag = 'false'  // Reset flag after drag

  // Remove drag-over class from all rows
  document.querySelectorAll('#itemsBody tr').forEach(row => {
    row.classList.remove('drag-over')
  })
}

/* ------------------------- STYLE & COLOR ------------------------ */
const styleMode = document.getElementById('styleMode')
const accentColor = document.getElementById('accentColor')
const hexInput = document.getElementById('hexInput')
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

// Update accent color swatch and sync inputs
function updateAccentSwatch() {
  swAccent.style.background = accentColor.value
  hexInput.value = accentColor.value.toUpperCase()
}

// Validate and apply hex input
function applyHexInput(hex) {
  // Add # if missing
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }

  // Validate hex format
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (hexPattern.test(hex)) {
    accentColor.value = hex
    swAccent.style.background = hex
    updatePreviewColors()
    return true
  }
  return false
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
  const mode = styleMode.value

  if (mode === 'outline') {
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

  // Set colors based on style mode
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
// Color picker input event
accentColor.addEventListener('input', () => {
  updateAccentSwatch()
  updatePreviewColors()
})

// Hex input events
hexInput.addEventListener('input', (e) => {
  const hex = e.target.value
  if (hex.length >= 6) { // Only try to apply when we have enough characters
    applyHexInput(hex)
  }
})

hexInput.addEventListener('blur', (e) => {
  const hex = e.target.value
  if (hex && !applyHexInput(hex)) {
    // Reset to current color if invalid
    hexInput.value = accentColor.value.toUpperCase()
  }
})

hexInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const hex = e.target.value
    if (hex && !applyHexInput(hex)) {
      // Reset to current color if invalid
      hexInput.value = accentColor.value.toUpperCase()
    }
    e.target.blur()
  }
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

/* ------------------------- TEMPLATE SYSTEM ----------------------- */
// Global template state
let selectedTemplate = null

// Set due date based on days from invoice date
function setDueDate(days) {
  const invoiceDateEl = document.getElementById('invoiceDate')
  const dueDateEl = document.getElementById('dueDate')

  if (!invoiceDateEl || !dueDateEl) return

  // Get invoice date or use today if not set
  let invoiceDate
  if (invoiceDateEl.value) {
    invoiceDate = new Date(invoiceDateEl.value)
  } else {
    invoiceDate = new Date()
    const yyyy = invoiceDate.getFullYear()
    const mm = String(invoiceDate.getMonth() + 1).padStart(2, '0')
    const dd = String(invoiceDate.getDate()).padStart(2, '0')
    invoiceDateEl.value = `${yyyy}-${mm}-${dd}`
  }

  // Calculate due date
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + days)

  // Format as YYYY-MM-DD
  const yyyy = dueDate.getFullYear()
  const mm = String(dueDate.getMonth() + 1).padStart(2, '0')
  const dd = String(dueDate.getDate()).padStart(2, '0')
  dueDateEl.value = `${yyyy}-${mm}-${dd}`

  // Update active button state
  document.querySelectorAll('.due-date-btn').forEach(btn => {
    btn.classList.remove('active')
    if (btn.dataset.days === String(days)) {
      btn.classList.add('active')
    }
  })
}

// Initialize template system
document.addEventListener('DOMContentLoaded', () => {
  // Set invoice date to today by default
  const invoiceDateField = document.getElementById('invoiceDate')
  if (invoiceDateField && !invoiceDateField.value) {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    invoiceDateField.value = `${yyyy}-${mm}-${dd}`
  }

  // Set default due date (30 days from today)
  setDueDate(30)

  // Auto-update abbreviation when company name changes
  const toCompanyEl = document.getElementById('toCompany')
  const companyAbbrevEl = document.getElementById('companyAbbrev')

  if (toCompanyEl && companyAbbrevEl) {
    toCompanyEl.addEventListener('blur', () => {
      // Only auto-fill if abbreviation is empty
      if (!companyAbbrevEl.value || !companyAbbrevEl.value.trim()) {
        const abbrev = generateAbbreviation(toCompanyEl.value)
        companyAbbrevEl.value = abbrev
      }
    })
  }

  const filterChips = document.querySelectorAll('.filter-chip')
  const templateInput = document.getElementById('templateInput')

  // Quick access chip selection
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Remove active class from all chips
      filterChips.forEach(c => c.classList.remove('active'))

      // Add active class to clicked chip
      chip.classList.add('active')

      // Store selection
      selectedTemplate = chip.dataset.template

      // Update input field
      if (templateInput) {
        templateInput.value = selectedTemplate
        updateActionButtons()
      }
    })
  })

  // Template input change handler
  if (templateInput) {
    templateInput.addEventListener('input', (e) => {
      selectedTemplate = e.target.value
      updateActionButtons()
      updateTemplateChipSelection()
    })
  }

  // Initialize display
  initializeTemplateDisplay()
  updateActionButtons()
})

// Toggle dropdown visibility
function toggleTemplateDropdown() {
  const dropdown = document.getElementById('templateDropdown')
  if (!dropdown) return

  const isVisible = dropdown.style.display === 'block'

  if (isVisible) {
    dropdown.style.display = 'none'
  } else {
    populateTemplateDropdown()
    dropdown.style.display = 'block'
  }
}

// Populate dropdown with grouped sections and icons
function populateTemplateDropdown() {
  const dropdown = document.getElementById('templateDropdown')
  const content = dropdown.querySelector('.template-dropdown-content')
  if (!content) return

  content.innerHTML = ''

  const starred = getStarredTemplates()
  const recent = getRecentTemplate()
  const saved = getTemplates()
  const predefined = ['default-client', 'tech-company', 'sample-client', 'freelance']
  const allTemplates = [...new Set([...predefined, ...Object.keys(saved)])]

  // Starred section (with ★ icon)
  if (starred.length > 0) {
    const starSection = createDropdownSection('★ STARRED', starred, true)
    content.appendChild(starSection)
  }

  // Recent section (with ⏱ icon)
  if (recent && !starred.includes(recent)) {
    const recentSection = createDropdownSection('⏱ RECENT', [recent], false)
    content.appendChild(recentSection)
  }

  // All templates section (with 📁 icon)
  const nonStarred = allTemplates.filter(t => !starred.includes(t) && t !== recent)
  if (nonStarred.length > 0) {
    const allSection = createDropdownSection('📁 ALL TEMPLATES', nonStarred.sort(), false)
    content.appendChild(allSection)
  }
}

// Create a dropdown section with title and items
function createDropdownSection(title, items, showStars) {
  const section = document.createElement('div')
  section.className = 'template-dropdown-section'

  // Section title
  const titleEl = document.createElement('div')
  titleEl.className = 'template-dropdown-section-title'
  titleEl.textContent = title
  section.appendChild(titleEl)

  // Section items
  items.forEach(itemName => {
    const itemEl = document.createElement('div')
    itemEl.className = 'template-dropdown-item'
    if (showStars) itemEl.classList.add('starred')
    itemEl.textContent = itemName
    itemEl.onclick = () => selectTemplateFromDropdown(itemName)
    section.appendChild(itemEl)
  })

  return section
}

// Select template from dropdown
function selectTemplateFromDropdown(templateName) {
  const input = document.getElementById('templateInput')
  if (input) {
    input.value = templateName
  }
  toggleTemplateDropdown()
  updateActionButtons()
  updateTemplateChipSelection()
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('templateDropdown')
  if (!dropdown) return

  const templateGroup = e.target.closest('.template-input-group')

  if (!templateGroup && dropdown.style.display === 'block') {
    dropdown.style.display = 'none'
  }
})

// Add keyboard navigation (Escape to close)
document.addEventListener('keydown', (e) => {
  const dropdown = document.getElementById('templateDropdown')
  if (!dropdown) return

  if (e.key === 'Escape' && dropdown.style.display === 'block') {
    dropdown.style.display = 'none'
  }
})

// Update action buttons based on current selection
function updateActionButtons() {
  const templateInput = document.getElementById('templateInput')
  const saveAction = document.getElementById('saveAction')
  const starAction = document.getElementById('starAction')
  const deleteAction = document.getElementById('deleteAction')

  if (!templateInput || !saveAction || !starAction || !deleteAction) return

  const selectedTemplate = templateInput.value.trim()
  const savedTemplates = getTemplates()
  const starredTemplates = getStarredTemplates()
  const predefinedTemplates = ['default-client', 'tech-company', 'sample-client', 'freelance', 'default']

  if (!selectedTemplate) {
    // No selection - show save only
    saveAction.style.display = 'flex'
    starAction.style.display = 'none'
    deleteAction.style.display = 'none'
    saveAction.title = 'Save current form as new template'
    return
  }

  const exists = savedTemplates.hasOwnProperty(selectedTemplate) || predefinedTemplates.includes(selectedTemplate)
  const isStarred = starredTemplates.includes(selectedTemplate)
  const isPredefined = predefinedTemplates.includes(selectedTemplate)
  const isCustom = savedTemplates.hasOwnProperty(selectedTemplate)

  if (exists) {
    // Template exists
    saveAction.style.display = 'flex'
    saveAction.title = 'Update existing template'
    saveAction.querySelector('span').textContent = '💾' // Update icon

    starAction.style.display = 'flex'
    if (isStarred) {
      starAction.title = 'Remove star'
      starAction.querySelector('span').textContent = '★'
      starAction.style.color = '#f59e0b' // Gold color for filled star
    } else {
      starAction.title = 'Add star'
      starAction.querySelector('span').textContent = '☆'
      starAction.style.color = 'var(--ui-fg)' // Normal text color for outline star
    }

    deleteAction.style.display = isCustom ? 'flex' : 'none'
    deleteAction.title = 'Delete template'
  } else {
    // Template doesn't exist - new template
    saveAction.style.display = 'flex'
    saveAction.title = 'Save as new template'
    saveAction.querySelector('span').textContent = '💾'

    starAction.style.display = 'none'
    deleteAction.style.display = 'none'
  }
}

// Sync template chip selection with input
function updateTemplateChipSelection() {
  const templateInput = document.getElementById('templateInput')
  const filterChips = document.querySelectorAll('.filter-chip')

  if (!templateInput) return

  const selectedTemplate = templateInput.value.trim()

  // Update chip selection
  filterChips.forEach(chip => {
    chip.classList.remove('active')
    if (chip.dataset.template === selectedTemplate) {
      chip.classList.add('active')
    }
  })
}

// Initialize template display
function initializeTemplateDisplay() {
  const starred = getStarredTemplates()
  const recent = getRecentTemplate()
  const filterChips = document.querySelectorAll('.filter-chip')

  // Update template chips display
  let visibleChips = 0

  // Show starred templates first (max 3)
  starred.slice(0, 3).forEach((template, index) => {
    if (filterChips[index]) {
      filterChips[index].textContent = template
      filterChips[index].dataset.template = template
      filterChips[index].style.display = 'block'
      filterChips[index].classList.remove('recent-chip')
      visibleChips++
    }
  })

  // Show recent template if there's space and it's not already shown
  if (recent && visibleChips < 3 && !starred.includes(recent)) {
    if (filterChips[visibleChips]) {
      filterChips[visibleChips].textContent = recent
      filterChips[visibleChips].dataset.template = recent
      filterChips[visibleChips].style.display = 'block'
      filterChips[visibleChips].classList.add('recent-chip')
      visibleChips++
    }
  }

  // Show default if no templates are visible
  if (visibleChips === 0) {
    if (filterChips[0]) {
      filterChips[0].textContent = 'Default'
      filterChips[0].dataset.template = 'default'
      filterChips[0].style.display = 'block'
      filterChips[0].classList.remove('recent-chip')
      visibleChips++
    }
  }

  // Hide remaining chips
  for (let i = visibleChips; i < filterChips.length; i++) {
    filterChips[i].style.display = 'none'
  }
}

// Load selected template from quick access or input
function loadQuickTemplate() {
  const filterChips = document.querySelectorAll('.filter-chip')
  const templateInput = document.getElementById('templateInput')

  // Find active chip or use input value
  let selectedTemplate = null

  const activeChip = document.querySelector('.filter-chip.active')
  if (activeChip) {
    selectedTemplate = activeChip.dataset.template
  } else if (templateInput && templateInput.value.trim()) {
    selectedTemplate = templateInput.value.trim()
  }

  if (!selectedTemplate) {
    alert('Please select a template first')
    return
  }

  // Load predefined template
  const predefinedTemplates = ['default-client', 'tech-company', 'sample-client', 'freelance']
  if (predefinedTemplates.includes(selectedTemplate)) {
    loadTemplateById(selectedTemplate)
    return
  }

  // Load custom template
  const savedTemplates = getTemplates()
  if (savedTemplates[selectedTemplate]) {
    loadTemplateData(savedTemplates[selectedTemplate])
    updateRecentTemplate(selectedTemplate)
    return
  }

  // Handle default
  if (selectedTemplate === 'default') {
    // Clear form to defaults
    const fields = ['fromName', 'fromWebsite', 'fromPhone', 'fromAddress', 'toCompany', 'toNames', 'toAddress', 'toContact', 'paymentInstructions', 'currency']
    fields.forEach(field => {
      const element = document.getElementById(field)
      if (element) element.value = ''
    })
    return
  }

  alert('Template not found')
}

// Handle save action
function handleSaveAction() {
  const templateInput = document.getElementById('templateInput')
  const selectedTemplate = templateInput ? templateInput.value.trim() : ''

  if (!selectedTemplate) {
    const templateName = prompt('Enter template name:')
    if (templateName) {
      saveCustomTemplate(templateName)
      templateInput.value = templateName
      updateActionButtons()
      initializeTemplateDisplay()
    }
    return
  }

  // Update existing or save new
  const savedTemplates = getTemplates()
  if (savedTemplates.hasOwnProperty(selectedTemplate)) {
    if (confirm(`Update template "${selectedTemplate}"?`)) {
      saveCustomTemplate(selectedTemplate)
      updateActionButtons()
      initializeTemplateDisplay()
    }
  } else {
    saveCustomTemplate(selectedTemplate)
    initializeTemplateDisplay()
    updateActionButtons()
  }
}

// Handle star action
function handleStarAction() {
  const templateInput = document.getElementById('templateInput')
  const selectedTemplate = templateInput ? templateInput.value.trim() : ''

  if (!selectedTemplate) {
    alert('Please select a template first')
    return
  }

  const starredTemplates = getStarredTemplates()

  if (starredTemplates.includes(selectedTemplate)) {
    // Remove star
    removeStarredTemplate(selectedTemplate)
    alert(`Removed star from "${selectedTemplate}"`)
  } else {
    // Add star
    if (starredTemplates.length >= 3) {
      alert('You can only have 3 starred templates. Please remove a star first.')
      return
    }
    addStarredTemplate(selectedTemplate)
    alert(`Added star to "${selectedTemplate}"`)
  }

  updateActionButtons()
  initializeTemplateDisplay()
}

// Handle delete action
function handleDeleteAction() {
  const templateInput = document.getElementById('templateInput')
  const selectedTemplate = templateInput ? templateInput.value.trim() : ''

  if (!selectedTemplate) {
    alert('Please select a template first')
    return
  }

  const savedTemplates = getTemplates()
  if (!savedTemplates.hasOwnProperty(selectedTemplate)) {
    alert('Cannot delete: template not found or is a built-in template')
    return
  }

  if (confirm(`Are you sure you want to delete template "${selectedTemplate}"?`)) {
    delete savedTemplates[selectedTemplate]
    saveTemplates(savedTemplates)
    removeStarredTemplate(selectedTemplate)

    // Clear input
    templateInput.value = ''

    updateActionButtons()
    initializeTemplateDisplay()

    alert(`Template "${selectedTemplate}" deleted successfully!`)
  }
}

// Load template by ID
function loadTemplateById(templateId) {
  const templates = {
    'default-client': {
      fromName: 'Your Company Name',
      fromWebsite: 'www.yourwebsite.com',
      fromPhone: 'Your Phone Number',
      fromAddress: 'Your Business Address',
      toCompany: 'Client Company',
      toNames: 'Client Contact Name',
      toAddress: 'Client Address',
      toContact: 'client@email.com',
      paymentInstructions: 'Enter your payment instructions here',
      invoiceNotes: '',
      notesPosition: 'above',
      currency: 'USD',
      invoiceDate: '',
      dueDate: '',
      invoiceTitle: '',
      companyAbbrev: '',
      invoiceSequence: '01',
      lineItems: [],
      saveLineItems: false
    },
    'tech-company': {
      fromName: 'Your Company Name',
      fromWebsite: 'www.yourwebsite.com',
      fromPhone: 'Your Phone Number',
      fromAddress: 'Your Business Address',
      toCompany: 'Tech Client Inc.',
      toNames: 'Technical Contact',
      toAddress: 'Client Location',
      toContact: 'tech@client.com',
      paymentInstructions: 'Enter your payment instructions here',
      invoiceNotes: '',
      notesPosition: 'above',
      currency: 'USD',
      invoiceDate: '',
      dueDate: '',
      invoiceTitle: '',
      companyAbbrev: 'TCI',
      invoiceSequence: '01',
      lineItems: [],
      saveLineItems: false
    },
    'sample-client': {
      fromName: 'Your Company Name',
      fromWebsite: 'www.yourwebsite.com',
      fromPhone: 'Your Phone Number',
      fromAddress: 'Your Business Address',
      toCompany: 'Sample Client',
      toNames: 'Client Contact',
      toAddress: 'Client Address',
      toContact: 'contact@sampleclient.com',
      paymentInstructions: 'Enter your payment instructions here',
      invoiceNotes: '',
      notesPosition: 'above',
      currency: 'USD',
      invoiceDate: '',
      dueDate: '',
      invoiceTitle: '',
      companyAbbrev: 'SC',
      invoiceSequence: '01',
      lineItems: [],
      saveLineItems: false
    },
    'freelance': {
      fromName: 'Your Company Name',
      fromWebsite: 'www.yourwebsite.com',
      fromPhone: 'Your Phone Number',
      fromAddress: 'Your Business Address',
      toCompany: 'Freelance Client',
      toNames: 'Project Manager',
      toAddress: 'Client Location',
      toContact: 'contact@freelanceclient.com',
      paymentInstructions: 'Enter your payment instructions here',
      invoiceNotes: '',
      notesPosition: 'above',
      currency: 'USD',
      invoiceDate: '',
      dueDate: '',
      invoiceTitle: '',
      companyAbbrev: 'FC',
      invoiceSequence: '01',
      lineItems: [],
      saveLineItems: false
    }
  }

  const templateData = templates[templateId]
  if (templateData) {
    loadTemplateData(templateData)
    // Update recent templates
    updateRecentTemplate(templateId)
  }
}


// Handle template management actions
function handleTemplateAction(action) {
  switch (action) {
    case 'save':
      const templateName = prompt('Enter template name:')
      if (templateName) {
        saveCustomTemplate(templateName)
      }
      break
    case 'load':
      showLoadTemplateDialog()
      break
    case 'star':
      showStarTemplateDialog()
      break
    case 'unstar':
      showUnstarTemplateDialog()
      break
    case 'delete':
      showDeleteTemplateDialog()
      break
  }
}

// Template management functions
function saveCustomTemplate(name) {
  const templates = getTemplates()
  templates[name] = getCurrentTemplateData()
  saveTemplates(templates)
  alert(`Template "${name}" saved successfully!`)
}

function showLoadTemplateDialog() {
  const templates = getTemplates()
  const templateNames = Object.keys(templates)

  if (templateNames.length === 0) {
    alert('No saved templates found.')
    return
  }

  const templateName = prompt(`Available templates:\n${templateNames.join('\n')}\n\nEnter template name to load:`)
  if (templateName && templates[templateName]) {
    loadTemplateData(templates[templateName])
    updateRecentTemplate(templateName)
  } else if (templateName) {
    alert('Template not found.')
  }
}

function showStarTemplateDialog() {
  const currentStarred = getStarredTemplates()
  if (currentStarred.length >= 3) {
    alert('You can only have 3 starred templates. Please remove a star first.')
    return
  }

  const templateName = prompt('Enter template name to star:')
  if (templateName) {
    addStarredTemplate(templateName)
    updateTemplateDisplay()
  }
}

function showUnstarTemplateDialog() {
  const starred = getStarredTemplates()
  if (starred.length === 0) {
    alert('No starred templates found.')
    return
  }

  const templateName = prompt(`Starred templates:\n${starred.join('\n')}\n\nEnter template name to unstar:`)
  if (templateName && starred.includes(templateName)) {
    removeStarredTemplate(templateName)
    updateTemplateDisplay()
  }
}

function showDeleteTemplateDialog() {
  const templates = getTemplates()
  const templateNames = Object.keys(templates)

  if (templateNames.length === 0) {
    alert('No saved templates found.')
    return
  }

  const templateName = prompt(`Saved templates:\n${templateNames.join('\n')}\n\nEnter template name to delete:`)
  if (templateName && templates[templateName]) {
    if (confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      delete templates[templateName]
      saveTemplates(templates)
      removeStarredTemplate(templateName) // Remove from starred if present
      updateTemplateDisplay()
      alert(`Template "${templateName}" deleted successfully!`)
    }
  } else if (templateName) {
    alert('Template not found.')
  }
}

// Starred templates management
const STARRED_KEY = 'starred_templates'
const RECENT_KEY = 'recent_template'

function getStarredTemplates() {
  const stored = localStorage.getItem(STARRED_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveStarredTemplates(starred) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(starred))
}

function addStarredTemplate(templateName) {
  const starred = getStarredTemplates()
  if (!starred.includes(templateName) && starred.length < 3) {
    starred.push(templateName)
    saveStarredTemplates(starred)
  }
}

function removeStarredTemplate(templateName) {
  const starred = getStarredTemplates()
  const index = starred.indexOf(templateName)
  if (index > -1) {
    starred.splice(index, 1)
    saveStarredTemplates(starred)
  }
}

function updateRecentTemplate(templateName) {
  localStorage.setItem(RECENT_KEY, templateName)
  updateTemplateDisplay()
}

function getRecentTemplate() {
  return localStorage.getItem(RECENT_KEY) || ''
}

function updateTemplateDisplay() {
  const starred = getStarredTemplates()
  const recent = getRecentTemplate()

  // Update starred chips
  const starredChips = document.querySelectorAll('.filter-group:first-child .filter-chip')
  starredChips.forEach((chip, index) => {
    if (starred[index]) {
      chip.textContent = starred[index]
      chip.setAttribute('data-template', starred[index])
      chip.style.display = 'block'
    } else {
      chip.style.display = 'none'
    }
  })

  // Update recent chip
  const recentChip = document.querySelector('.filter-group:last-child .filter-chip')
  if (recent && recentChip) {
    recentChip.textContent = recent
    recentChip.setAttribute('data-template', recent)
  }
}

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
  // Check if user wants to save line items with template
  const saveLineItemsCheckbox = document.getElementById('saveLineItemsCheckbox')
  const saveLineItems = saveLineItemsCheckbox ? saveLineItemsCheckbox.checked : false

  // Get company abbreviation and sequence with null checks
  const companyAbbrevEl = document.getElementById('companyAbbrev')
  const invoiceSeqEl = document.getElementById('invoiceSequence')

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
    invoiceNotes: document.getElementById('invoiceNotes')?.value || '',
    notesPosition: getNotesPosition(),  // Notes position (above or below)
    currency: document.getElementById('currency').value,
    invoiceDate: document.getElementById('invoiceDate').value,
    dueDate: document.getElementById('dueDate').value,
    invoiceTitle: document.getElementById('invoiceTitle')?.value || '',  // New title field
    companyAbbrev: companyAbbrevEl ? companyAbbrevEl.value : '',
    invoiceSequence: invoiceSeqEl ? invoiceSeqEl.value : '',
    paperSize: document.getElementById('paperSize').value,
    orientation: document.getElementById('orientation').value,
    styleMode: document.getElementById('styleMode').value,
    accentColor: document.getElementById('accentColor').value,
    lineItems: saveLineItems ? getItems() : [],  // Conditional: save items or empty array
    saveLineItems: saveLineItems,
    logoDataUrl: document.getElementById('logoPreview').src || null
  }
}

// Load template data into form
function loadTemplateData(templateData) {
  // Handle backwards compatibility: convert old invoiceNumber to new split fields
  if (templateData.invoiceNumber && !templateData.companyAbbrev && !templateData.invoiceSequence) {
    // Parse old format "IN-19" or "IN-ABBREV-19" into new fields
    const parts = templateData.invoiceNumber.replace(/^IN-/i, '').split('-')
    if (parts.length === 2) {
      templateData.companyAbbrev = parts[0]
      templateData.invoiceSequence = parts[1]
    } else if (parts.length === 1) {
      templateData.companyAbbrev = ''
      templateData.invoiceSequence = parts[0]
    }
  }

  Object.keys(templateData).forEach(key => {
    if (key === 'logoDataUrl') {
      // Special handling for logo
      const logoPreview = document.getElementById('logoPreview')
      if (logoPreview && templateData[key]) {
        logoPreview.src = templateData[key]
        logoPreview.style.display = 'block'
      }
    } else if (key === 'invoiceNumber') {
      // Skip old invoiceNumber field - already converted above
      return
    } else if (key === 'lineItems') {
      // Skip line items here - handled separately below
      return
    } else if (key === 'saveLineItems') {
      // Restore checkbox state if stored
      const saveItemsCheckbox = document.getElementById('saveLineItemsCheckbox')
      if (saveItemsCheckbox) {
        saveItemsCheckbox.checked = templateData[key]
      }
    } else if (key === 'notesPosition') {
      // Restore notes position radio button
      const radio = document.querySelector(`input[name="notesPosition"][value="${templateData[key]}"]`)
      if (radio) radio.checked = true
    } else {
      const element = document.getElementById(key)
      if (element) {
        element.value = templateData[key]

        // Update hex input if this is the accent color
        if (key === 'accentColor') {
          const hexInput = document.getElementById('hexInput')
          const swatch = document.getElementById('swAccent')
          if (hexInput) hexInput.value = templateData[key]
          if (swatch) swatch.style.background = templateData[key]

          // Update CSS custom property for preview
          document.documentElement.style.setProperty('--accent-color', templateData[key])
        }
      }
    }
  })

  // Load line items if present and not empty
  if (templateData.lineItems && Array.isArray(templateData.lineItems) && templateData.lineItems.length > 0) {
    // Clear existing items first
    document.getElementById('itemsBody').innerHTML = ''

    // Add each saved line item (including type)
    templateData.lineItems.forEach(item => {
      addItem(item.description || '', item.qty || '', item.rate || '', item.type || '')
    })
  }

  // Update preview colors and render after loading template data
  updatePreviewColors()
  renderPreview()
}


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

/* ----------------------- GOOGLE CALENDAR ------------------------- */
let gcalAccessToken = null
let gcalEvents = []

function saveGcalClientId() {
  const clientId = document.getElementById('gcalClientId').value.trim()
  if (!clientId) {
    alert('Please enter a Client ID')
    return
  }
  localStorage.setItem('gcal_client_id', clientId)
  alert('Client ID saved!')
}

function connectGoogleCalendar() {
  const clientId = document.getElementById('gcalClientId').value.trim() ||
    localStorage.getItem('gcal_client_id')

  if (!clientId) {
    alert('Please enter and save a Google Cloud Client ID first')
    return
  }

  if (typeof google === 'undefined' || !google.accounts) {
    alert('Google Identity Services not loaded. Check your internet connection and reload.')
    return
  }

  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    callback: async (tokenResponse) => {
      if (tokenResponse.error) {
        alert('Authorization failed: ' + tokenResponse.error)
        return
      }
      gcalAccessToken = tokenResponse.access_token
      document.getElementById('gcalConnectBtn').textContent = 'Connected'
      document.getElementById('gcalPanel').style.display = 'block'
      document.getElementById('gcalOptionsGroup').style.display = ''
      document.getElementById('gcalFetchRow').style.display = ''
      await loadCalendarList()
    },
  })

  tokenClient.requestAccessToken()
}

async function loadCalendarList() {
  if (!gcalAccessToken) return

  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${gcalAccessToken}` } }
    )

    if (res.status === 401) {
      gcalAccessToken = null
      document.getElementById('gcalConnectBtn').textContent = 'Connect Google Calendar'
      document.getElementById('gcalPanel').style.display = 'none'
      document.getElementById('gcalOptionsGroup').style.display = 'none'
      document.getElementById('gcalFetchRow').style.display = 'none'
      alert('Session expired. Please reconnect.')
      return
    }

    const data = await res.json()
    const select = document.getElementById('gcalCalendarSelect')
    select.innerHTML = ''
    ;(data.items || []).forEach((cal) => {
      const opt = document.createElement('option')
      opt.value = cal.id
      opt.textContent = cal.summary
      if (cal.primary) opt.selected = true
      select.appendChild(opt)
    })
  } catch (e) {
    alert('Failed to load calendars: ' + e.message)
  }
}

async function fetchGcalEvents() {
  if (!gcalAccessToken) {
    alert('Please connect Google Calendar first')
    return
  }

  const calendarId = document.getElementById('gcalCalendarSelect').value
  const dateFrom = document.getElementById('gcalDateFrom').value
  const dateTo = document.getElementById('gcalDateTo').value
  const filter = document.getElementById('gcalFilter').value.trim().toLowerCase()
  const groupByTitle = document.getElementById('gcalGroupByTitle').checked

  if (!calendarId || !dateFrom || !dateTo) {
    alert('Please select a calendar and date range')
    return
  }

  const timeMin = new Date(dateFrom).toISOString()
  const timeMax = new Date(dateTo + 'T23:59:59').toISOString()

  try {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
    url.searchParams.set('timeMin', timeMin)
    url.searchParams.set('timeMax', timeMax)
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '250')

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${gcalAccessToken}` },
    })

    if (res.status === 401) {
      gcalAccessToken = null
      document.getElementById('gcalConnectBtn').textContent = 'Connect Google Calendar'
      document.getElementById('gcalPanel').style.display = 'none'
      document.getElementById('gcalOptionsGroup').style.display = 'none'
      document.getElementById('gcalFetchRow').style.display = 'none'
      alert('Session expired. Please reconnect.')
      return
    }

    const data = await res.json()
    let events = (data.items || [])
      .filter((e) => e.status !== 'cancelled')
      .filter((e) => e.start?.dateTime && e.end?.dateTime)  // Skip all-day events
      .map((e) => {
        const start = new Date(e.start.dateTime)
        const end = new Date(e.end.dateTime)
        const hours = (end - start) / 3600000
        return {
          title: e.summary || '(No title)',
          date: start.toLocaleDateString(),
          hours: Math.round(hours * 100) / 100,
          selected: true,
        }
      })

    // Apply text filter
    if (filter) {
      events = events.filter((e) =>
        e.title.toLowerCase().includes(filter)
      )
    }

    // Group by title if requested
    if (groupByTitle && events.length > 0) {
      const grouped = {}
      events.forEach((e) => {
        if (!grouped[e.title]) {
          grouped[e.title] = { ...e, hours: 0 }
        }
        grouped[e.title].hours += e.hours
      })
      events = Object.values(grouped).map((e) => ({
        ...e,
        hours: Math.round(e.hours * 100) / 100,
        date: '(grouped)',
      }))
    }

    gcalEvents = events
    renderGcalEvents()
  } catch (e) {
    alert('Failed to fetch events: ' + e.message)
  }
}

function renderGcalEvents() {
  const container = document.getElementById('gcalEventsContainer')
  const list = document.getElementById('gcalEventsList')
  list.innerHTML = ''

  if (gcalEvents.length === 0) {
    list.innerHTML = '<div style="padding:12px;opacity:0.6">No events found</div>'
    container.style.display = 'block'
    return
  }

  gcalEvents.forEach((event, index) => {
    const item = document.createElement('div')
    item.className = 'gcal-event-item'
    item.onclick = (e) => {
      if (e.target.tagName !== 'INPUT') toggleGcalEvent(index)
    }
    item.innerHTML = `
      <input type="checkbox" ${event.selected ? 'checked' : ''} onchange="toggleGcalEvent(${index})" />
      <span class="gcal-event-title">${event.title}</span>
      <span class="gcal-event-date">${event.date}</span>
      <span class="gcal-event-duration">${event.hours}h</span>
    `
    list.appendChild(item)
  })

  container.style.display = 'block'
}

function toggleGcalEvent(index) {
  gcalEvents[index].selected = !gcalEvents[index].selected
  renderGcalEvents()
}

function gcalSelectAll() {
  gcalEvents.forEach((e) => (e.selected = true))
  renderGcalEvents()
}

function gcalDeselectAll() {
  gcalEvents.forEach((e) => (e.selected = false))
  renderGcalEvents()
}

function importGcalEvents() {
  const rate = parseFloat(document.getElementById('gcalRate').value) || 0
  const selected = gcalEvents.filter((e) => e.selected)

  if (selected.length === 0) {
    alert('No events selected')
    return
  }

  selected.forEach((e) => {
    addItem(e.title, String(e.hours), String(rate), '')
  })

  alert(`Imported ${selected.length} event(s) as line items!`)
}

// Initialize Google Calendar on load
;(function initGcal() {
  const savedClientId = localStorage.getItem('gcal_client_id')
  const clientIdInput = document.getElementById('gcalClientId')
  if (savedClientId && clientIdInput) {
    clientIdInput.value = savedClientId
  }

  // Set default date range to current month
  const now = new Date()
  const fromDate = document.getElementById('gcalDateFrom')
  const toDate = document.getElementById('gcalDateTo')
  if (fromDate && toDate) {
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    fromDate.value = `${yyyy}-${mm}-01`
    const lastDay = new Date(yyyy, now.getMonth() + 1, 0).getDate()
    toDate.value = `${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`
  }
})()

/* ---------------------------- PREVIEW ---------------------------- */
// Calculate subtotals grouped by type
function calculateSubtotalsByType(items) {
  const typeGroups = {}
  let uncategorizedTotal = 0
  let hasTypes = false

  items.forEach(item => {
    const amount = +item.amount || 0
    const type = item.type && item.type.trim() ? item.type.trim() : null

    if (type) {
      hasTypes = true
      if (!typeGroups[type]) {
        typeGroups[type] = 0
      }
      typeGroups[type] += amount
    } else {
      uncategorizedTotal += amount
    }
  })

  return { typeGroups, uncategorizedTotal, hasTypes }
}

// Calculate notes section height for PDF
function calculateNotesHeight(doc, notes, contentW) {
  if (!notes || !notes.trim()) return 0

  const headerHeight = 5
  const headerPadding = 6
  const lineHeight = 4
  const bottomPadding = 4

  let totalLines = 0
  notes.split('\n').forEach(line => {
    if (line.trim()) {
      const wrapped = doc.splitTextToSize(line, contentW - 4.2)
      totalLines += wrapped.length
    }
  })

  return headerHeight + headerPadding + (totalLines * lineHeight) + bottomPadding
}

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
  // Build invoice number from separate fields: IN-{abbreviation}-{sequence}
  // Add null checks to prevent errors if elements don't exist
  const companyAbbrevEl = $('companyAbbrev')
  const invoiceSeqEl = $('invoiceSequence')
  const companyAbbrev = companyAbbrevEl ? companyAbbrevEl.value.trim().toUpperCase() : ''
  const invoiceSeq = invoiceSeqEl ? invoiceSeqEl.value.trim() : '01'
  const invoiceNumber = `IN-${companyAbbrev}-${invoiceSeq}`
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
  const invoiceNotesVal = $('invoiceNotes')?.value || ''
  const invoiceTitleVal = $('invoiceTitle')?.value || ''
  const notesPosition = getNotesPosition()
  const invoiceDateVal = $('invoiceDate').value
  const dueDateVal = $('dueDate').value
  const items = getItems()
  const hasTypes = hasAnyTypes(items)
  const { typeGroups, uncategorizedTotal } = calculateSubtotalsByType(items)
  const subtotal = items.reduce(
    (sum, item) => sum + (+item.amount || 0),
    0
  )

  // Build table rows with conditional TYPE column
  const rows = items
    .map(
      (item) => `
        <tr>
          ${hasTypes ? `<td>${item.type || ''}</td>` : ''}
          <td>${item.description}</td>
          <td class="invoice-cell--center">${item.qty}</td>
          <td class="invoice-cell--right">${fmtMoney(item.rate)}</td>
          <td class="invoice-cell--right invoice-cell--em">${fmtMoney(item.amount)}</td>
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
        ${invoiceTitleVal ? `<div class="invoice-head__subtitle">${invoiceTitleVal}</div>` : ''}
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
      ${notesPosition === 'above' && invoiceNotesVal ? `
        <div class="invoice-notes-section">
          <div class="invoice-panel">
            <div class="invoice-panel__title">NOTES</div>
            <div class="invoice-panel__pre">${invoiceNotesVal}</div>
          </div>
        </div>
      ` : ''}
      <table class="invoice-table${hasTypes ? ' has-types' : ''}">
        <colgroup>
          ${hasTypes ? '<col />' : ''}
          <col /><col /><col /><col />
        </colgroup>
        <thead>
          <tr>
            ${hasTypes ? '<th>TYPE</th>' : ''}
            <th>DESCRIPTION</th>
            <th class="invoice-cell--center">QTY/HRS</th>
            <th class="invoice-cell--right">RATE</th>
            <th class="invoice-cell--right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${notesPosition === 'below' && invoiceNotesVal ? `
        <div class="invoice-notes-section">
          <div class="invoice-panel">
            <div class="invoice-panel__title">NOTES</div>
            <div class="invoice-panel__pre">${invoiceNotesVal}</div>
          </div>
        </div>
      ` : ''}
      <div class="invoice-summary">
        <div class="invoice-panel">
          <div class="invoice-panel__title">PAYMENT INSTRUCTIONS</div>
          <div class="invoice-panel__pre">${paymentInstructionsVal}</div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-panel__title">TOTAL</div>
          <div class="invoice-summary__totals">
            ${Object.keys(typeGroups).length > 0 ? Object.entries(typeGroups).sort((a, b) => a[0].localeCompare(b[0])).map(([type, amount]) =>
              `<div class="invoice-summary__line"><span>${type}:</span><span>${fmtMoney(amount)}</span></div>`
            ).join('') : ''}
            ${uncategorizedTotal > 0 && Object.keys(typeGroups).length > 0 ? `<div class="invoice-summary__line"><span>Other:</span><span>${fmtMoney(uncategorizedTotal)}</span></div>` : ''}
            <div class="invoice-summary__total"><span>TOTAL (${currencyValue}):</span><span>${fmtMoney(subtotal)}</span></div>
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
        mode: 'same-origin',
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
    name: 'IBMPlexMono-Bold',
    vfs: 'IBMPlexMono-Bold.ttf',
    input: 'fontHdr',
    status: 'fontHdrStatus',
    localPath: './fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf',
    style: 'bold',
    urls: [],
  },
  body: {
    name: 'IBMPlexMono-Regular',
    vfs: 'IBMPlexMono-Regular.ttf',
    input: 'fontBody',
    status: 'fontBodyStatus',
    localPath: './fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf',
    style: 'normal',
    urls: [],
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

// Font loading functions removed - using system fonts for reliability

Object.keys(FONT_TARGETS).forEach((k) => {
  const element = document.getElementById(FONT_TARGETS[k].input)
  if (element) {
    element.addEventListener('change', (e) => {
      const f = e.target.files?.[0]
      if (f) loadLocalFont(k, f)
    })
  }
})

async function ensureFonts() {
  if (fontsReady) return await fontsReady

  fontsReady = (async () => {
    // Step 1: Check user-uploaded fonts
    for (const k of ['body', 'hdr']) {
      if (window.__pdfFonts[k]) {
        setStatus(k, 'ok', 'Custom Font')
        continue
      }

      // Step 2: Try auto-loading IBM Plex Mono from local files
      try {
        const ab = await fetchFirst([FONT_TARGETS[k].localPath])
        window.__pdfFonts[k] = toB64(ab)
        setStatus(k, 'ok', 'IBM Plex Mono')
      } catch (e) {
        console.warn(`Auto-load ${FONT_TARGETS[k].name} failed, will use Helvetica fallback`)
        setStatus(k, 'warn', 'Helvetica (fallback)')
      }
    }

    // Determine font names — if IBM Plex Mono loaded, use it; else Helvetica
    const ibmLoaded = !!(window.__pdfFonts.body && window.__pdfFonts.hdr)
    return {
      hdr: ibmLoaded ? 'IBMPlexMono' : 'helvetica',
      body: ibmLoaded ? 'IBMPlexMono' : 'helvetica',
      ok: true,
      method: ibmLoaded ? 'ibm-plex-mono' : 'system'
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
  // Wait for jsPDF to load if it's still loading
  let retries = 0
  while ((!window.jspdf || !window.jspdf.jsPDF) && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('jsPDF library failed to load. Please check your internet connection and refresh the page.')
    return
  }

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
  // Build invoice number from separate fields: IN-{abbreviation}-{sequence}
  // Add null checks to prevent errors if elements don't exist
  const companyAbbrevEl = document.getElementById('companyAbbrev')
  const invoiceSeqEl = document.getElementById('invoiceSequence')
  const companyAbbrev = companyAbbrevEl ? companyAbbrevEl.value.trim().toUpperCase() : ''
  const invoiceSeq = invoiceSeqEl ? invoiceSeqEl.value.trim() : '01'
  const invoiceNumber = `IN-${companyAbbrev}-${invoiceSeq}`
  const invoiceDate = fmtDatePDF(
    document.getElementById('invoiceDate').value
  )
  const dueDate = fmtDatePDF(document.getElementById('dueDate').value)
  const currency = document.getElementById('currency').value
  const paymentInstructions = document.getElementById('paymentInstructions').value
  const invoiceNotes = document.getElementById('invoiceNotes')?.value || ''
  const invoiceTitle = document.getElementById('invoiceTitle')?.value || ''
  const notesPosition = getNotesPosition()
  const items = getItems()
  const hasTypes = hasAnyTypes(items)

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

  // Register IBM Plex Mono on the doc instance (if loaded)
  if (window.__pdfFonts.body) {
    doc.addFileToVFS('IBMPlexMono-Regular.ttf', window.__pdfFonts.body)
    doc.addFont('IBMPlexMono-Regular.ttf', 'IBMPlexMono', 'normal')
  }
  if (window.__pdfFonts.hdr) {
    doc.addFileToVFS('IBMPlexMono-Bold.ttf', window.__pdfFonts.hdr)
    doc.addFont('IBMPlexMono-Bold.ttf', 'IBMPlexMono', 'bold')
  }

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Paper
  doc.setFillColor(paperRGB.r, paperRGB.g, paperRGB.b)
  doc.rect(0, 0, pageW, pageH, 'F')

  // Colors & stroke - consistent thin lines throughout
  doc.setDrawColor(inkRGB.r, inkRGB.g, inkRGB.b)
  doc.setTextColor(textRGB.r, textRGB.g, textRGB.b)
  doc.setLineWidth(0.2) // Uniform thin line weight for all PDF elements

  const margin = 10,
    contentW = pageW - 2 * margin,
    splitW = contentW * 0.66

  // OPTION A - Condensed header on all pages with perfect alignment
  // All pages use same positioning for consistent content alignment
  const HEADER_END_Y = 30             // Header separator line (all pages)
  const CONTENT_START_Y = 35          // Content starts here (all pages - ALIGNED!)
                                      // - Page 1: FROM/BILL TO grid at y=35mm
                                      // - Page 2+: Line items table at y=35mm (same position!)
  const colW = contentW / 4           // Column width for 4-column grid (moved early for measurement)
  const SECTION_SPACER = 8            // Gap between sections
  const BOTTOM_MARGIN = 15            // Bottom page margin
  const ROW_HEIGHT = 10               // Line item row height
  const TABLE_HEADER_HEIGHT = 8       // Line items table header height

  // Dynamic grid height based on actual content
  function calculateGridHeight(doc, colTextWidth) {
    const headerH = 11  // header text (5mm) + divider + gap to content
    const lineH = 4     // line spacing
    const padBottom = 2  // bottom padding

    // Set font for measurement (8pt, matching rendering)
    doc.setFontSize(8)

    // Measure FROM column (bold for name, normal for rest)
    doc.setFont(fonts.body, 'bold')
    let fromLines = doc.splitTextToSize(fromName, colTextWidth).length
    doc.setFont(fonts.body, 'normal')
    if (fromWebsite) fromLines += doc.splitTextToSize(fromWebsite, colTextWidth).length
    if (fromPhone) fromLines += doc.splitTextToSize('TEL: ' + fromPhone, colTextWidth).length
    fromLines += doc.splitTextToSize(fromAddress, colTextWidth).length

    // Measure BILL TO column (bold for company, normal for rest)
    doc.setFont(fonts.body, 'bold')
    let toLines = doc.splitTextToSize(toCompany, colTextWidth).length
    doc.setFont(fonts.body, 'normal')
    toLines += doc.splitTextToSize('ATTN: ' + toNames, colTextWidth).length
    toLines += doc.splitTextToSize(toAddress, colTextWidth).length

    // Measure RECIPIENT CONTACT column
    let contactLines = 0
    toContact.split('\n').slice(0, 4).forEach(line => {
      contactLines += doc.splitTextToSize(line, colTextWidth).length
    })

    // SPECIFICATIONS is always 4 lines (ISSUED, DUE, CURRENCY, TERMS)
    const specLines = 4

    const maxLines = Math.max(fromLines, toLines, contactLines, specLines)
    return Math.max(headerH + (maxLines * lineH) + padBottom, 25)  // 25mm minimum
  }

  const DATA_GRID_HEIGHT = calculateGridHeight(doc, colW - 4.2)

  // Legacy compatibility aliases
  const bottomMargin = BOTTOM_MARGIN
  const dataGridH = DATA_GRID_HEIGHT
  const itemsHeaderH = TABLE_HEADER_HEIGHT
  const rowH = ROW_HEIGHT
  const spacer = SECTION_SPACER

  // OPTION A - CONDENSED PAGE 1 HEADER with visual distinction
  doc.setFont(fonts.hdr, 'bold')
  doc.setTextColor(accRGB.r, accRGB.g, accRGB.b)

  {
    // CONDENSED HEADER with visual distinction on page 1
    // Logo - compact size
    if (logoDataUrl) {
      const maxW = 35, maxH = 15  // Condensed logo
      let w = maxW, h = maxH
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
      doc.addImage(logoDataUrl, 'PNG', margin, 10, w, h)
    }

    // INVOICE text - LARGER on page 1 for distinction
    doc.setFontSize(16)  // Visually distinct (larger than page 2's 11pt)
    doc.text('INVOICE', pageW - margin, 18, { align: 'right' })

    doc.setFontSize(11)
    doc.text(invoiceNumber.toUpperCase(), pageW - margin, 24, { align: 'right' })

    // Invoice title/dates if present (same font size as invoice number)
    if (invoiceTitle) {
      doc.setFont(fonts.body, 'normal')
      doc.setFontSize(9)
      doc.text(invoiceTitle, pageW - margin, 28, { align: 'right' })
    }

    // Separator line at condensed position (30mm - same as page 2)
    if (showB) doc.line(margin, HEADER_END_Y, pageW - margin, HEADER_END_Y)
  }

  // Dynamic payment section height calculation
  function calculatePaymentHeight(doc, paymentInstructions, splitW, items) {
    // Base measurements
    const headerHeight = 5
    const headerPadding = 6
    const lineHeight = 4
    const bottomPadding = 4

    // Calculate payment instruction lines
    let paymentLines = 0
    paymentInstructions.split('\n').forEach(line => {
      if (line.trim()) {
        const wrapped = doc.splitTextToSize(line, splitW - 4.2)
        paymentLines += wrapped.length
      }
    })

    // Calculate total section lines DYNAMICALLY based on type subtotals
    const { typeGroups, uncategorizedTotal, hasTypes } = calculateSubtotalsByType(items)
    const typeCount = hasTypes ? Object.keys(typeGroups).length : 0
    const uncatLine = uncategorizedTotal > 0 && hasTypes ? 1 : 0
    const totalLine = 1  // Always have TOTAL line
    const totalExtraSpacing = 5

    const totalLines = typeCount + uncatLine + totalLine

    // Calculate heights for both sections
    const paymentSectionHeight = headerHeight + headerPadding +
      (paymentLines * lineHeight) + bottomPadding
    const totalSectionHeight = headerHeight + headerPadding +
      (totalLines * lineHeight) + totalExtraSpacing + bottomPadding

    // Return the larger of the two sections, with increased minimum for dynamic content
    return Math.max(paymentSectionHeight, totalSectionHeight, 25)
  }

  // Calculate dynamic payment height (now with items parameter)
  const paymentH = calculatePaymentHeight(doc, paymentInstructions, splitW, items)

  // OPTION A - FORWARD CALCULATION with perfect alignment
  // Calculate notes height (dynamic, can be 0)
  const notesH = calculateNotesHeight(doc, invoiceNotes, contentW)

  // All pages: Content starts at CONTENT_START_Y = 35mm (perfect alignment!)
  const yDataTop = CONTENT_START_Y  // FROM/BILL TO grid at 35mm on page 1

  // Line items start after grid + notes (if notes above)
  const notesOffset = notesPosition === 'above' && notesH > 0 ? notesH + SECTION_SPACER : 0
  const yItemsTop = yDataTop + DATA_GRID_HEIGHT + SECTION_SPACER + notesOffset

  // Calculate space available for line items on page 1
  const yPaymentTop = pageH - BOTTOM_MARGIN - paymentH
  let availableSpaceForItemsPage1 = yPaymentTop - SECTION_SPACER - yItemsTop

  // If notes below, subtract notes space from available items space
  if (notesPosition === 'below' && notesH > 0) {
    availableSpaceForItemsPage1 -= (notesH + SECTION_SPACER)
  }

  const maxRowsFitFirstPage = Math.max(
    0,
    Math.floor((availableSpaceForItemsPage1 - TABLE_HEADER_HEIGHT) / ROW_HEIGHT)
  )

  // Page 2+: Line items start at CONTENT_START_Y (35mm - SAME as page 1 grid!)
  // Perfect alignment between pages
  const yItemsTopContinuation = CONTENT_START_Y  // 35mm on all pages
  const availableSpaceForItemsContinuation = yPaymentTop - SECTION_SPACER - yItemsTopContinuation
  const maxRowsFitContinuationPage = Math.max(
    0,
    Math.floor((availableSpaceForItemsContinuation - TABLE_HEADER_HEIGHT) / ROW_HEIGHT)
  )

  // Determine how many pages we need
  let totalPages = 1
  let remainingItems = items.length - maxRowsFitFirstPage
  if (remainingItems > 0) {
    totalPages += Math.ceil(remainingItems / maxRowsFitContinuationPage)
  }

  const rowsFirstPage = Math.min(items.length, maxRowsFitFirstPage)

  // Spec grid with optional fill/borders
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
  doc.setFont(fonts.hdr, 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)

  // Grid headers with CSS padding (8px ≈ 2.1mm)
  doc.setFontSize(7)
  doc.text('FROM', margin + 2.1, yDataTop + 5)
  doc.text('BILL TO', margin + colW + 2.1, yDataTop + 5)
  doc.text('RECIPIENT CONTACT', margin + 2 * colW + 2.1, yDataTop + 5)
  doc.text('SPECIFICATIONS', margin + 3 * colW + 2.1, yDataTop + 5)

  // Divider lines under grid panel headers (match preview border-bottom)
  if (showB) {
    const headerLineY = yDataTop + 7
    for (let i = 0; i < 4; i++) {
      const colStart = margin + i * colW + 2.1
      const colEnd = margin + (i + 1) * colW - 2.1
      doc.line(colStart, headerLineY, colEnd, headerLineY)
    }
  }

  // Grid body
  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(8)

  // CSS padding alignment (8px ≈ 2.1mm) with breathing room
  let x0 = margin + 2.1,
    y0 = yDataTop + 11
  const colTextW = colW - 4.2
  doc.setFont(fonts.body, 'bold')
  doc.splitTextToSize(fromName, colTextW).forEach(line => {
    if (y0 < yDataTop + dataGridH - 2) { doc.text(line, x0, y0); y0 += 4 }
  })
  doc.setFont(fonts.body, 'normal')
  if (fromWebsite) {
    doc.splitTextToSize(fromWebsite, colTextW).forEach(line => {
      if (y0 < yDataTop + dataGridH - 2) { doc.text(line, x0, y0); y0 += 4 }
    })
  }
  if (fromPhone) {
    doc.splitTextToSize('TEL: ' + fromPhone, colTextW).forEach(line => {
      if (y0 < yDataTop + dataGridH - 2) { doc.text(line, x0, y0); y0 += 4 }
    })
  }
  const fromAddressLines = doc.splitTextToSize(fromAddress, colTextW)
  fromAddressLines.forEach(line => {
    if (y0 < yDataTop + dataGridH - 2) {
      doc.text(line, x0, y0)
      y0 += 4
    }
  })

  // recipient
  x0 = margin + colW + 2.1
  y0 = yDataTop + 11
  doc.setFont(fonts.body, 'bold')
  doc.splitTextToSize(toCompany, colTextW).forEach(line => {
    if (y0 < yDataTop + dataGridH - 2) { doc.text(line, x0, y0); y0 += 4 }
  })
  doc.setFont(fonts.body, 'normal')
  doc.splitTextToSize('ATTN: ' + toNames, colTextW).forEach(line => {
    if (y0 < yDataTop + dataGridH - 2) { doc.text(line, x0, y0); y0 += 4 }
  })
  const toAddressLines = doc.splitTextToSize(toAddress, colTextW)
  toAddressLines.forEach(line => {
    if (y0 < yDataTop + dataGridH - 2) {
      doc.text(line, x0, y0)
      y0 += 4
    }
  })

  // contact
  x0 = margin + 2 * colW + 2.1
  y0 = yDataTop + 11
  toContact
    .split('\n')
    .slice(0, 4)
    .forEach((line) => {
      const wrappedLines = doc.splitTextToSize(line, colW - 4.2)
      wrappedLines.forEach((wrappedLine) => {
        if (y0 < yDataTop + dataGridH - 2) {
          doc.text(wrappedLine, x0, y0)
          y0 += 4
        }
      })
    })

  // specs
  x0 = margin + 3 * colW + 2.1
  y0 = yDataTop + 11
  doc.text('ISSUED: ' + invoiceDate, x0, y0)
  y0 += 4
  doc.text('DUE: ' + dueDate, x0, y0)
  y0 += 4
  doc.text('CURRENCY: ' + currency, x0, y0)
  y0 += 4
  doc.text('TERMS: NET 30', x0, y0)

  // NOTES SECTION - Render ABOVE items if position is 'above'
  const yNotesTop = yDataTop + DATA_GRID_HEIGHT + SECTION_SPACER

  if (notesPosition === 'above' && notesH > 0) {
    // Render notes box
    if (showF && boxAlpha > 0) {
      doc.setFillColor(boxRGB.r, boxRGB.g, boxRGB.b)
      doc.setGState(new doc.GState({ opacity: boxAlpha }))
      doc.rect(margin, yNotesTop, contentW, notesH, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
    }
    if (showB) {
      doc.rect(margin, yNotesTop, contentW, notesH)
    }

    // Notes header
    doc.setFont(fonts.hdr, 'bold')
    doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
    doc.setFontSize(7)
    doc.text('NOTES', margin + 2.1, yNotesTop + 5)

    // Divider line under NOTES header (match grid panel headers)
    if (showB) {
      doc.line(margin + 2.1, yNotesTop + 7, margin + contentW - 2.1, yNotesTop + 7)
    }

    // Notes content
    doc.setFont(fonts.body, 'normal')
    doc.setFontSize(8)
    let ny = yNotesTop + 11
    invoiceNotes.split('\n').forEach(line => {
      if (line.trim()) {
        const lines = doc.splitTextToSize(line, contentW - 4.2)
        lines.forEach(L => {
          if (ny < yNotesTop + notesH - 2) {
            doc.text(L, margin + 2.1, ny)
            ny += 4
          }
        })
      }
    })
  }

  // Multi-page line items rendering - conditional column widths
  let typeW, descW, qtyW, rateW, amtW
  let xType, xDesc, xQty, xRate, xAmt

  if (hasTypes) {
    // With TYPE column - MUST ADD TO 100% for proper right alignment
    typeW = contentW * 0.13   // 13% - TYPE (was 12%)
    descW = contentW * 0.42   // 42% - DESCRIPTION (was 38%, increased for readability)
    qtyW = contentW * 0.10    // 10% - QTY/HRS (was 12%, narrower for numbers)
    rateW = contentW * 0.15   // 15% - RATE (was 13%, money needs space)
    amtW = contentW * 0.20    // 20% - AMOUNT (was 15%, emphasized)
    // Total: 13 + 42 + 10 + 15 + 20 = 100% ✓

    xType = margin
    xDesc = xType + typeW
    xQty = xDesc + descW
    xRate = xQty + qtyW
    xAmt = xRate + rateW
    // Right edge of table: xAmt + amtW = margin + contentW ✓
  } else {
    // Without TYPE column - adds to 100% ✓
    descW = contentW * 0.5    // 50%
    qtyW = contentW * 0.15    // 15%
    rateW = contentW * 0.15   // 15%
    amtW = contentW * 0.2     // 20%
    // Total: 100% ✓

    xDesc = margin
    xQty = xDesc + descW
    xRate = xQty + qtyW
    xAmt = xRate + rateW
  }

  // Function to render line items table header
  function renderTableHeader(yTop) {
    const tableHeaderH = itemsHeaderH

    if (showF && boxAlpha > 0) {
      doc.setFillColor(boxRGB.r, boxRGB.g, boxRGB.b)
      doc.setGState(new doc.GState({ opacity: boxAlpha }))
      doc.rect(margin, yTop, contentW, tableHeaderH, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
    }

    doc.setFont(fonts.hdr, 'bold')
    doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)

    doc.setFontSize(8)
    const hY = yTop + 5
    if (hasTypes) doc.text('TYPE', xType + typeW / 2, hY, { align: 'center' })
    doc.text('DESCRIPTION', xDesc + 2, hY)
    doc.text('QTY/HRS', xQty + qtyW / 2, hY, { align: 'center' })
    doc.text('RATE', xRate + rateW - 2, hY, { align: 'right' })
    doc.text('AMOUNT', xAmt + amtW - 2, hY, { align: 'right' })

    if (showB) {
      doc.line(margin, yTop + itemsHeaderH, margin + contentW, yTop + itemsHeaderH)
    }
  }

  // Function to render line items
  function renderLineItems(itemsToRender, yTop, maxRows) {
    const actualRows = Math.min(itemsToRender.length, maxRows)
    const tableH = itemsHeaderH + actualRows * rowH

    if (showB) {
      doc.rect(margin, yTop, contentW, tableH)
      if (hasTypes) doc.line(xDesc, yTop, xDesc, yTop + tableH)  // TYPE column border
      doc.line(xQty, yTop, xQty, yTop + tableH)
      doc.line(xRate, yTop, xRate, yTop + tableH)
      doc.line(xAmt, yTop, xAmt, yTop + tableH)
    }

    renderTableHeader(yTop)

    doc.setFont(fonts.body, 'normal')
    doc.setTextColor(tableTextRGB.r, tableTextRGB.g, tableTextRGB.b)
    doc.setFontSize(8)
    let y = yTop + itemsHeaderH
    let pageSubtotal = 0

    for (let i = 0; i < actualRows; i++) {
      const it = itemsToRender[i]

      if (showF && boxAlpha > 0) {
        doc.setFillColor(tableRGB.r, tableRGB.g, tableRGB.b)
        doc.setGState(new doc.GState({ opacity: 1 }))
        doc.rect(margin, y, contentW, rowH, 'F')
        doc.setGState(new doc.GState({ opacity: 1 }))
      }

      const rate = '$' + (+it.rate || 0).toFixed(2)
      const amtVal = +it.amount || 0
      const amt = '$' + amtVal.toFixed(2)
      pageSubtotal += amtVal

      // Render TYPE column if types exist (centered)
      if (hasTypes) {
        const typeLine = doc.splitTextToSize(it.type || '', typeW - 4)[0] || ''
        doc.text(typeLine, xType + typeW / 2, y + 6, { align: 'center' })
      }

      const dLine = doc.splitTextToSize(it.description, descW - 4)[0] || ''
      doc.text(dLine, xDesc + 2, y + 6)
      doc.text(String(it.qty || ''), xQty + qtyW / 2, y + 6, { align: 'center' })
      doc.text(rate, xRate + rateW - 2, y + 6, { align: 'right' })

      doc.setFont(fonts.body, 'bold')
      doc.text(amt, xAmt + amtW - 2, y + 6, { align: 'right' })
      doc.setFont(fonts.body, 'normal')

      y += rowH
      if (showB && i < actualRows - 1) {
        doc.line(margin, y, margin + contentW, y)
      }
    }

    return { renderedItems: actualRows, pageSubtotal }
  }

  // Render first page line items
  const firstPageResult = renderLineItems(items, yItemsTop, rowsFirstPage)
  let totalSubtotal = firstPageResult.pageSubtotal
  let itemIndex = firstPageResult.renderedItems

  // NOTES SECTION - Render BELOW items if position is 'below' (page 1 only)
  if (notesPosition === 'below' && notesH > 0) {
    const yNotesBelowItems = yPaymentTop - SECTION_SPACER - notesH

    // Render notes box
    if (showF && boxAlpha > 0) {
      doc.setFillColor(boxRGB.r, boxRGB.g, boxRGB.b)
      doc.setGState(new doc.GState({ opacity: boxAlpha }))
      doc.rect(margin, yNotesBelowItems, contentW, notesH, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
    }
    if (showB) {
      doc.rect(margin, yNotesBelowItems, contentW, notesH)
    }

    // Notes header
    doc.setFont(fonts.hdr, 'bold')
    doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
    doc.setFontSize(7)
    doc.text('NOTES', margin + 2.1, yNotesBelowItems + 5)

    // Divider line under NOTES header (match grid panel headers)
    if (showB) {
      doc.line(margin + 2.1, yNotesBelowItems + 7, margin + contentW - 2.1, yNotesBelowItems + 7)
    }

    // Notes content
    doc.setFont(fonts.body, 'normal')
    doc.setFontSize(8)
    let ny = yNotesBelowItems + 11
    invoiceNotes.split('\n').forEach(line => {
      if (line.trim()) {
        const lines = doc.splitTextToSize(line, contentW - 4.2)
        lines.forEach(L => {
          if (ny < yNotesBelowItems + notesH - 2) {
            doc.text(L, margin + 2.1, ny)
            ny += 4
          }
        })
      }
    })
  }

  // Render continuation pages if needed
  while (itemIndex < items.length) {
    doc.addPage()

    // Set up page background for new page
    doc.setFillColor(paperRGB.r, paperRGB.g, paperRGB.b)
    doc.rect(0, 0, pageW, pageH, 'F')

    // CONDENSED continuation page header (matches page 1 height)
    doc.setFont(fonts.hdr, 'bold')
    doc.setTextColor(accRGB.r, accRGB.g, accRGB.b)
    doc.setFontSize(11)  // Smaller than page 1 (16pt) for subtle distinction
    doc.text(`INVOICE ${invoiceNumber} (CONTINUED)`, pageW - margin, 15, { align: 'right' })
    doc.setFontSize(9)
    doc.text(`PAGE ${doc.internal.getCurrentPageInfo().pageNumber} OF ${totalPages}`, pageW - margin, 20, { align: 'right' })

    // Separator line at same position as page 1 (30mm)
    if (showB) {
      doc.setDrawColor(inkRGB.r, inkRGB.g, inkRGB.b)
      doc.setLineWidth(0.2)
      doc.line(margin, HEADER_END_Y, pageW - margin, HEADER_END_Y)
    }

    // Render line items starting at CONTENT_START_Y (35mm - SAME as page 1 grid!)
    const remainingItems = items.slice(itemIndex)
    const continuationPageResult = renderLineItems(
      remainingItems,
      yItemsTopContinuation,  // 35mm - aligned with page 1
      maxRowsFitContinuationPage
    )

    totalSubtotal += continuationPageResult.pageSubtotal
    itemIndex += continuationPageResult.renderedItems
  }

  // Payment + totals (always on the last page)
  const xSplit = margin + splitW

  // Calculate payment section position on current page
  const currentPageH = doc.internal.pageSize.getHeight()
  const yPayTop = currentPageH - bottomMargin - paymentH

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

  doc.setFont(fonts.hdr, 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(7)
  doc.text('PAYMENT INSTRUCTIONS', margin + 2.1, yPayTop + 5)

  // Divider line under PAYMENT INSTRUCTIONS header (match grid panel headers)
  if (showB) {
    doc.line(margin + 2.1, yPayTop + 7, margin + splitW - 2.1, yPayTop + 7)
  }

  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(8)
  let py = yPayTop + 11
  paymentInstructions.split('\n').forEach((line) => {
    if (line.trim()) { // Only process non-empty lines
      const lines = doc.splitTextToSize(line, splitW - 4.2) // Account for 8px padding on both sides
      lines.forEach((L) => {
        if (py < yPayTop + paymentH - 4) { // Better bottom margin
          doc.text(L, margin + 2.1, py) // 8px padding from left edge
          py += 4 // Increased line spacing
        }
      })
    }
  })

  doc.setFont(fonts.hdr, 'bold')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(7)
  doc.text('TOTAL', xSplit + 2.1, yPayTop + 5)

  // Divider line under TOTAL header (match grid panel headers)
  if (showB) {
    doc.line(xSplit + 2.1, yPayTop + 7, margin + contentW - 2.1, yPayTop + 7)
  }

  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(boxTextRGB.r, boxTextRGB.g, boxTextRGB.b)
  doc.setFontSize(8)
  const rightX = margin + contentW - 2.1
  let ty = yPayTop + 13

  // Show type subtotals ONLY if types exist
  const { typeGroups, uncategorizedTotal, hasTypes: hasTypesForTotals } = calculateSubtotalsByType(items)

  if (hasTypesForTotals && Object.keys(typeGroups).length > 0) {
    // Type subtotals (sorted alphabetically)
    Object.entries(typeGroups).sort((a, b) => a[0].localeCompare(b[0])).forEach(([type, amount]) => {
      doc.text(`${type}:`, xSplit + 2.1, ty)
      doc.text('$' + amount.toFixed(2), rightX, ty, { align: 'right' })
      ty += 4
    })

    // Uncategorized items (if any)
    if (uncategorizedTotal > 0) {
      doc.text('Other:', xSplit + 2.1, ty)
      doc.text('$' + uncategorizedTotal.toFixed(2), rightX, ty, { align: 'right' })
      ty += 4
    }

    ty += 2  // Small spacer before total
  }

  // TAX LINE REMOVED - no longer used

  ty += 5  // Spacing before total

  // Divider line above grand total (match preview border-top on .invoice-summary__total)
  if (showB) {
    doc.line(xSplit + 2.1, ty - 3, margin + contentW - 2.1, ty - 3)
  }

  // Final total
  doc.setFont(fonts.body, 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL (' + currency + '): ', xSplit + 2.1, ty)
  doc.text('$' + totalSubtotal.toFixed(2), rightX, ty, { align: 'right' })

  doc.save(`invoice-${invoiceNumber}.pdf`)
}
import { ref } from 'vue'
import { jsPDF } from 'jspdf'
import { useInvoiceStore } from '../stores/invoiceStore'

export function usePdf() {
  const generating = ref(false)
  const invoiceStore = useInvoiceStore()

  // Color utilities
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  function getLuminance(hex) {
    const rgb = hexToRgb(hex)
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const bright = Math.max(lum1, lum2)
    const dark = Math.min(lum1, lum2)
    return (bright + 0.05) / (dark + 0.05)
  }

  function getReadableTextColor(backgroundColor) {
    const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF')
    return whiteContrast >= 4.5 ? '#FFFFFF' : '#000000'
  }

  function lightenColor(hex, amount) {
    const rgb = hexToRgb(hex)
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount))
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount))
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  function getComputedColors() {
    const accent = invoiceStore.form.accentColor
    const mode = invoiceStore.form.styleMode

    if (mode === 'outline') {
      return {
        paper: '#FFFFFF',
        ink: accent,
        text: '#111111',
        accent: accent,
        fill: '#FFFFFF',
        tableFill: '#FFFFFF',
        textOnFill: '#111111',
        textOnAccent: getReadableTextColor(accent)
      }
    } else if (mode === 'ascii') {
      return {
        paper: '#000000',
        ink: accent,
        text: accent,
        accent: accent,
        fill: '#000000',
        tableFill: '#000000',
        textOnFill: accent,
        textOnAccent: '#000000'
      }
    } else {
      const brightFill = lightenColor(accent, 0.6)
      const tableFill = lightenColor(accent, 0.85)
      return {
        paper: accent,
        ink: '#111111',
        text: '#111111',
        accent: accent,
        fill: brightFill,
        tableFill: tableFill,
        textOnFill: '#111111',
        textOnAccent: '#111111'
      }
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getCurrencySymbol() {
    const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$', JPY: '¥' }
    return symbols[invoiceStore.form.currency] || '$'
  }

  async function downloadPdf() {
    generating.value = true

    try {
      const form = invoiceStore.form
      const items = invoiceStore.lineItems.filter(i => i.description)
      const colors = getComputedColors()
      const currencySymbol = getCurrencySymbol()

      // Paper dimensions
      const paperSizes = {
        letter: { w: 215.9, h: 279.4 },
        a4: { w: 210, h: 297 },
        legal: { w: 215.9, h: 355.6 }
      }
      const paper = paperSizes[form.paperSize] || paperSizes.letter
      const isLandscape = form.orientation === 'landscape'
      const pageW = isLandscape ? paper.h : paper.w
      const pageH = isLandscape ? paper.w : paper.h

      // Create PDF
      const doc = new jsPDF({
        orientation: form.orientation,
        unit: 'mm',
        format: [pageW, pageH]
      })

      // Layout constants
      const MARGIN = 15
      const HEADER_END_Y = 30
      const CONTENT_START_Y = 35
      const DATA_GRID_HEIGHT = 35
      const ROW_HEIGHT = 8
      const TABLE_HEADER_HEIGHT = 8

      // Set paper background
      const paperRgb = hexToRgb(colors.paper)
      doc.setFillColor(paperRgb.r, paperRgb.g, paperRgb.b)
      doc.rect(0, 0, pageW, pageH, 'F')

      // Draw header
      let y = MARGIN

      // Logo
      if (invoiceStore.logoDataUrl && invoiceStore.logoNatural) {
        const logoH = 15
        const logoW = Math.min(35, logoH * invoiceStore.logoNatural.ratio)
        doc.addImage(invoiceStore.logoDataUrl, 'PNG', MARGIN, y, logoW, logoH)
      }

      // INVOICE title
      const textRgb = hexToRgb(colors.accent)
      doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', pageW - MARGIN, y + 6, { align: 'right' })

      // Invoice number
      const inkRgb = hexToRgb(colors.text)
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(invoiceStore.invoiceNumber, pageW - MARGIN, y + 12, { align: 'right' })

      // Invoice title/dates
      if (form.invoiceTitle) {
        doc.setFontSize(9)
        doc.text(form.invoiceTitle, pageW - MARGIN, y + 17, { align: 'right' })
      }

      // Dates
      doc.setFontSize(9)
      const datesY = form.invoiceTitle ? y + 22 : y + 17
      doc.text(`Issued: ${formatDate(form.invoiceDate)}`, pageW - MARGIN, datesY, { align: 'right' })
      doc.text(`Due: ${formatDate(form.dueDate)}`, pageW - MARGIN, datesY + 4, { align: 'right' })

      // Header line
      const accentRgb = hexToRgb(colors.ink)
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
      doc.setLineWidth(0.5)
      doc.line(MARGIN, HEADER_END_Y, pageW - MARGIN, HEADER_END_Y)

      y = CONTENT_START_Y

      // FROM / BILL TO boxes
      const boxWidth = (pageW - MARGIN * 2 - 10) / 2
      const boxHeight = DATA_GRID_HEIGHT

      // Draw boxes
      function drawBox(x, y, w, h, title, lines) {
        const fillRgb = hexToRgb(colors.fill)
        doc.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
        doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
        doc.rect(x, y, w, h, 'FD')

        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(title, x + 4, y + 6)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        let lineY = y + 12
        lines.forEach(line => {
          if (line) {
            doc.text(line, x + 4, lineY)
            lineY += 4
          }
        })
      }

      drawBox(MARGIN, y, boxWidth, boxHeight, 'FROM', [
        form.fromName,
        form.fromWebsite,
        form.fromPhone,
        form.fromAddress
      ])

      drawBox(MARGIN + boxWidth + 10, y, boxWidth, boxHeight, 'BILL TO', [
        form.toCompany,
        form.toNames,
        form.toAddress,
        form.toContact
      ])

      y += boxHeight + 8

      // Notes (above items)
      if (form.invoiceNotes && form.notesPosition === 'above') {
        const fillRgb = hexToRgb(colors.fill)
        doc.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
        doc.rect(MARGIN, y, pageW - MARGIN * 2, 20, 'FD')

        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTES', MARGIN + 4, y + 6)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const noteLines = doc.splitTextToSize(form.invoiceNotes, pageW - MARGIN * 2 - 8)
        doc.text(noteLines, MARGIN + 4, y + 12)
        y += 25
      }

      // Line items table
      const hasTypes = invoiceStore.hasAnyTypes
      const colWidths = hasTypes
        ? { type: 25, desc: 65, qty: 20, rate: 30, amt: 40 }
        : { desc: 90, qty: 20, rate: 30, amt: 40 }

      const tableWidth = pageW - MARGIN * 2
      const tableX = MARGIN

      // Table header
      const fillRgb = hexToRgb(colors.fill)
      doc.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
      doc.rect(tableX, y, tableWidth, TABLE_HEADER_HEIGHT, 'FD')

      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')

      let colX = tableX + 2
      if (hasTypes) {
        doc.text('TYPE', colX + colWidths.type / 2, y + 5, { align: 'center' })
        colX += colWidths.type
      }
      doc.text('DESCRIPTION', colX + 2, y + 5)
      colX += colWidths.desc
      doc.text('QTY', colX + colWidths.qty / 2, y + 5, { align: 'center' })
      colX += colWidths.qty
      doc.text('RATE', colX + colWidths.rate - 2, y + 5, { align: 'right' })
      colX += colWidths.rate
      doc.text('AMOUNT', colX + colWidths.amt - 2, y + 5, { align: 'right' })

      y += TABLE_HEADER_HEIGHT

      // Table rows
      doc.setFont('helvetica', 'normal')
      items.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          const tableFillRgb = hexToRgb(colors.tableFill)
          doc.setFillColor(tableFillRgb.r, tableFillRgb.g, tableFillRgb.b)
          doc.rect(tableX, y, tableWidth, ROW_HEIGHT, 'F')
        }

        doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
        doc.rect(tableX, y, tableWidth, ROW_HEIGHT, 'S')

        colX = tableX + 2
        if (hasTypes) {
          doc.text(item.type || '', colX + colWidths.type / 2, y + 5, { align: 'center' })
          colX += colWidths.type
        }
        doc.text(item.description || '', colX + 2, y + 5)
        colX += colWidths.desc
        doc.text(item.qty?.toString() || '', colX + colWidths.qty / 2, y + 5, { align: 'center' })
        colX += colWidths.qty
        doc.text(`${currencySymbol}${parseFloat(item.rate || 0).toFixed(2)}`, colX + colWidths.rate - 2, y + 5, { align: 'right' })
        colX += colWidths.rate
        doc.setFont('helvetica', 'bold')
        doc.text(`${currencySymbol}${item.amount}`, colX + colWidths.amt - 2, y + 5, { align: 'right' })
        doc.setFont('helvetica', 'normal')

        y += ROW_HEIGHT
      })

      y += 8

      // Notes (below items)
      if (form.invoiceNotes && form.notesPosition === 'below') {
        doc.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
        doc.rect(MARGIN, y, pageW - MARGIN * 2, 20, 'FD')

        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTES', MARGIN + 4, y + 6)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const noteLines = doc.splitTextToSize(form.invoiceNotes, pageW - MARGIN * 2 - 8)
        doc.text(noteLines, MARGIN + 4, y + 12)
        y += 25
      }

      // Payment & Totals
      const footerBoxWidth = (pageW - MARGIN * 2 - 10) / 2

      // Payment box
      doc.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
      doc.rect(MARGIN, y, footerBoxWidth, 35, 'FD')

      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('PAYMENT', MARGIN + 4, y + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      if (form.paymentInstructions) {
        const paymentLines = doc.splitTextToSize(form.paymentInstructions, footerBoxWidth - 8)
        doc.text(paymentLines, MARGIN + 4, y + 12)
      }

      // Totals box
      const totalsX = MARGIN + footerBoxWidth + 10
      doc.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
      doc.rect(totalsX, y, footerBoxWidth, 35, 'FD')

      let totalsY = y + 8
      doc.setFontSize(9)

      // Subtotals by type
      if (invoiceStore.subtotalsByType.hasTypes) {
        const groups = invoiceStore.subtotalsByType.groups
        Object.keys(groups).sort().forEach(type => {
          doc.setFont('helvetica', 'normal')
          doc.text(`${type}:`, totalsX + 4, totalsY)
          doc.text(`${currencySymbol}${groups[type].toFixed(2)}`, totalsX + footerBoxWidth - 4, totalsY, { align: 'right' })
          totalsY += 5
        })

        if (invoiceStore.subtotalsByType.uncategorized > 0) {
          doc.text('Other:', totalsX + 4, totalsY)
          doc.text(`${currencySymbol}${invoiceStore.subtotalsByType.uncategorized.toFixed(2)}`, totalsX + footerBoxWidth - 4, totalsY, { align: 'right' })
          totalsY += 5
        }

        // Separator line
        doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
        doc.line(totalsX + 4, totalsY, totalsX + footerBoxWidth - 4, totalsY)
        totalsY += 5
      }

      // Total
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`TOTAL (${form.currency}):`, totalsX + 4, totalsY)
      doc.setFontSize(14)
      doc.text(`${currencySymbol}${invoiceStore.subtotal.toFixed(2)}`, totalsX + footerBoxWidth - 4, totalsY, { align: 'right' })

      // Save PDF
      const filename = `invoice-${invoiceStore.invoiceNumber}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Error generating PDF: ' + error.message)
    } finally {
      generating.value = false
    }
  }

  return {
    downloadPdf,
    generating
  }
}

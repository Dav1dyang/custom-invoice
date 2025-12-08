<script setup>
import { computed, ref } from 'vue'
import { useInvoiceStore } from '../../stores/invoiceStore'
import { usePdf } from '../../composables/usePdf'

const invoiceStore = useInvoiceStore()
const { downloadPdf, generating } = usePdf()

const previewMode = computed(() => invoiceStore.form.styleMode)

const invoiceNumber = computed(() => invoiceStore.invoiceNumber)

const colors = computed(() => {
  const accent = invoiceStore.form.accentColor
  const mode = invoiceStore.form.styleMode

  if (mode === 'ascii') {
    return {
      paper: '#000000',
      text: accent,
      accent: accent,
      fill: '#000000'
    }
  } else if (mode === 'filled') {
    return {
      paper: accent,
      text: '#111111',
      accent: accent,
      fill: lightenColor(accent, 0.6)
    }
  } else {
    return {
      paper: '#FFFFFF',
      text: '#111111',
      accent: accent,
      fill: '#FFFFFF'
    }
  }
})

function lightenColor(hex, amount) {
  const rgb = hexToRgb(hex)
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount))
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const currencySymbol = computed(() => {
  const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$', JPY: '¥' }
  return symbols[invoiceStore.form.currency] || '$'
})
</script>

<template>
  <div class="preview-container">
    <div class="preview-actions">
      <button @click="downloadPdf" :disabled="generating" class="btn-download">
        {{ generating ? 'Generating...' : 'Download PDF' }}
      </button>
    </div>

    <div
      class="preview"
      :class="previewMode"
      :style="{
        '--preview-paper': colors.paper,
        '--preview-text': colors.text,
        '--preview-accent': colors.accent,
        '--preview-fill': colors.fill
      }"
    >
      <!-- Header -->
      <div class="preview-header">
        <div class="header-left">
          <img
            v-if="invoiceStore.logoDataUrl"
            :src="invoiceStore.logoDataUrl"
            alt="Logo"
            class="logo"
          />
          <div class="invoice-title">INVOICE</div>
        </div>
        <div class="header-right">
          <div class="invoice-number">{{ invoiceNumber }}</div>
          <div v-if="invoiceStore.form.invoiceTitle" class="invoice-subtitle">
            {{ invoiceStore.form.invoiceTitle }}
          </div>
          <div class="invoice-dates">
            <div>Issued: {{ formatDate(invoiceStore.form.invoiceDate) }}</div>
            <div>Due: {{ formatDate(invoiceStore.form.dueDate) }}</div>
          </div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-box">
          <div class="info-title">FROM</div>
          <div class="info-content">
            <div class="info-name">{{ invoiceStore.form.fromName }}</div>
            <div v-if="invoiceStore.form.fromWebsite">{{ invoiceStore.form.fromWebsite }}</div>
            <div v-if="invoiceStore.form.fromPhone">{{ invoiceStore.form.fromPhone }}</div>
            <div v-if="invoiceStore.form.fromAddress" class="address">{{ invoiceStore.form.fromAddress }}</div>
          </div>
        </div>
        <div class="info-box">
          <div class="info-title">BILL TO</div>
          <div class="info-content">
            <div class="info-name">{{ invoiceStore.form.toCompany }}</div>
            <div v-if="invoiceStore.form.toNames">{{ invoiceStore.form.toNames }}</div>
            <div v-if="invoiceStore.form.toAddress" class="address">{{ invoiceStore.form.toAddress }}</div>
            <div v-if="invoiceStore.form.toContact">{{ invoiceStore.form.toContact }}</div>
          </div>
        </div>
      </div>

      <!-- Notes (Above Items) -->
      <div v-if="invoiceStore.form.invoiceNotes && invoiceStore.form.notesPosition === 'above'" class="notes-section">
        <div class="notes-title">NOTES</div>
        <div class="notes-content">{{ invoiceStore.form.invoiceNotes }}</div>
      </div>

      <!-- Line Items -->
      <div class="items-section">
        <table class="items-table">
          <thead>
            <tr>
              <th v-if="invoiceStore.hasAnyTypes" class="type-col">TYPE</th>
              <th class="desc-col">DESCRIPTION</th>
              <th class="qty-col">QTY</th>
              <th class="rate-col">RATE</th>
              <th class="amt-col">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in invoiceStore.lineItems" :key="index" v-show="item.description">
              <td v-if="invoiceStore.hasAnyTypes" class="center">{{ item.type }}</td>
              <td>{{ item.description }}</td>
              <td class="center">{{ item.qty }}</td>
              <td class="right">{{ currencySymbol }}{{ parseFloat(item.rate || 0).toFixed(2) }}</td>
              <td class="right bold">{{ currencySymbol }}{{ item.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Notes (Below Items) -->
      <div v-if="invoiceStore.form.invoiceNotes && invoiceStore.form.notesPosition === 'below'" class="notes-section">
        <div class="notes-title">NOTES</div>
        <div class="notes-content">{{ invoiceStore.form.invoiceNotes }}</div>
      </div>

      <!-- Payment & Totals -->
      <div class="footer-grid">
        <div class="payment-box">
          <div class="info-title">PAYMENT</div>
          <div class="payment-content">{{ invoiceStore.form.paymentInstructions }}</div>
        </div>
        <div class="totals-box">
          <!-- Subtotals by type -->
          <div v-if="invoiceStore.subtotalsByType.hasTypes" class="subtotals">
            <div
              v-for="(amount, type) in invoiceStore.subtotalsByType.groups"
              :key="type"
              class="subtotal-row"
            >
              <span>{{ type }}:</span>
              <span>{{ currencySymbol }}{{ amount.toFixed(2) }}</span>
            </div>
            <div v-if="invoiceStore.subtotalsByType.uncategorized > 0" class="subtotal-row">
              <span>Other:</span>
              <span>{{ currencySymbol }}{{ invoiceStore.subtotalsByType.uncategorized.toFixed(2) }}</span>
            </div>
          </div>
          <div class="total-row">
            <span>TOTAL ({{ invoiceStore.form.currency }}):</span>
            <span class="total-amount">{{ currencySymbol }}{{ invoiceStore.subtotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.btn-download {
  flex: 1;
  padding: 12px 24px;
  font-size: var(--font-size-button);
  font-family: inherit;
  font-weight: 500;
  background: var(--ui-fg);
  color: var(--ui-bg);
  border: 1px solid var(--ui-fg);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
}

.btn-download:hover:not(:disabled) {
  background: transparent;
  color: var(--ui-fg);
}

.btn-download:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview {
  background: var(--preview-paper);
  color: var(--preview-text);
  padding: 24px;
  border: 1px solid var(--border);
  font-size: 11px;
  line-height: 1.4;
}

.preview.ascii {
  font-family: 'IBM Plex Mono', monospace;
}

/* Header */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--preview-accent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  max-width: 60px;
  max-height: 40px;
  object-fit: contain;
}

.invoice-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--preview-accent);
}

.header-right {
  text-align: right;
}

.invoice-number {
  font-size: 14px;
  font-weight: 700;
}

.invoice-subtitle {
  font-size: 9px;
  opacity: 0.8;
  margin-top: 2px;
}

.invoice-dates {
  font-size: 9px;
  margin-top: 4px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.info-box {
  padding: 12px;
  background: var(--preview-fill);
  border: 1px solid var(--preview-accent);
}

.info-title {
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--preview-text);
}

.info-content {
  font-size: 10px;
}

.info-name {
  font-weight: 600;
}

.address {
  white-space: pre-line;
}

/* Notes */
.notes-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--preview-fill);
  border: 1px solid var(--preview-accent);
}

.notes-title {
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 8px;
}

.notes-content {
  font-size: 10px;
  white-space: pre-line;
}

/* Items Table */
.items-section {
  margin-bottom: 16px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 8px;
  text-align: left;
  border: 1px solid var(--preview-accent);
}

.items-table th {
  font-size: 9px;
  font-weight: 700;
  background: var(--preview-fill);
}

.items-table td {
  font-size: 10px;
}

.type-col { width: 13%; }
.desc-col { width: 42%; }
.qty-col { width: 10%; }
.rate-col { width: 15%; }
.amt-col { width: 20%; }

.center { text-align: center; }
.right { text-align: right; }
.bold { font-weight: 700; }

/* Footer */
.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.payment-box {
  padding: 12px;
  background: var(--preview-fill);
  border: 1px solid var(--preview-accent);
}

.payment-content {
  font-size: 10px;
  white-space: pre-line;
}

.totals-box {
  padding: 12px;
  background: var(--preview-fill);
  border: 1px solid var(--preview-accent);
}

.subtotals {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--preview-accent);
}

.subtotal-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  margin-bottom: 4px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
}

.total-amount {
  font-size: 14px;
}
</style>

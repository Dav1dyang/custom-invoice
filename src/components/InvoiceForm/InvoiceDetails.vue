<script setup>
import { ref } from 'vue'
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()
const activeDueDays = ref(30)

function setDueDate(days) {
  activeDueDays.value = days
  invoiceStore.setDueDate(days)
}
</script>

<template>
  <section class="form-section">
    <h3 class="section-title">INVOICE DETAILS</h3>
    <div class="form-grid">
      <!-- Invoice Number -->
      <div class="form-group invoice-number-group">
        <label>INVOICE NUMBER</label>
        <div class="invoice-number-row">
          <span class="invoice-prefix">IN-</span>
          <input
            v-model="invoiceStore.form.companyAbbrev"
            type="text"
            placeholder="ABBREV"
            class="abbrev-input"
            maxlength="6"
          />
          <span class="invoice-dash">-</span>
          <input
            v-model="invoiceStore.form.invoiceSequence"
            type="text"
            placeholder="01"
            class="seq-input"
            maxlength="4"
          />
        </div>
      </div>

      <!-- Invoice Title -->
      <div class="form-group">
        <label for="invoiceTitle">TITLE/DATES</label>
        <input
          id="invoiceTitle"
          v-model="invoiceStore.form.invoiceTitle"
          type="text"
          placeholder="e.g., October Services, Q4 2025"
        />
      </div>

      <!-- Invoice Date -->
      <div class="form-group">
        <label for="invoiceDate">DATE ISSUED</label>
        <input
          id="invoiceDate"
          v-model="invoiceStore.form.invoiceDate"
          type="date"
        />
      </div>

      <!-- Due Date -->
      <div class="form-group">
        <label>DUE DATE</label>
        <div class="due-date-row">
          <div class="due-date-buttons">
            <button
              v-for="days in [7, 15, 30]"
              :key="days"
              @click="setDueDate(days)"
              class="due-date-btn"
              :class="{ active: activeDueDays === days }"
            >
              {{ days === 7 ? '1 Week' : `${days} Days` }}
            </button>
          </div>
          <input
            v-model="invoiceStore.form.dueDate"
            type="date"
            readonly
            class="due-date-input"
          />
        </div>
      </div>

      <!-- Currency -->
      <div class="form-group">
        <label for="currency">CURRENCY</label>
        <select id="currency" v-model="invoiceStore.form.currency">
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="CAD">CAD ($)</option>
          <option value="AUD">AUD ($)</option>
          <option value="JPY">JPY (¥)</option>
        </select>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.section-title {
  font-size: var(--font-size-h3);
  font-weight: 700;
  margin: 0 0 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.form-group input,
.form-group select {
  padding: 10px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid var(--border);
  background: var(--ui-bg);
  min-height: 36px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--ui-fg);
}

/* Invoice Number */
.invoice-number-row {
  display: flex;
  align-items: center;
}

.invoice-prefix,
.invoice-dash {
  padding: 0 4px;
  font-size: var(--font-size-body);
  font-weight: 500;
}

.abbrev-input {
  flex: 1;
  text-transform: uppercase;
}

.seq-input {
  width: 60px;
}

/* Due Date */
.due-date-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.due-date-buttons {
  display: flex;
  gap: 4px;
}

.due-date-btn {
  flex: 1;
  padding: 8px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.due-date-btn:hover,
.due-date-btn.active {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.due-date-input {
  background: var(--hover);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .due-date-buttons {
    flex-direction: column;
  }
}
</style>

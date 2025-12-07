<script setup>
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()

function handleCompanyBlur() {
  if (!invoiceStore.form.companyAbbrev) {
    invoiceStore.form.companyAbbrev = invoiceStore.generateAbbreviation(invoiceStore.form.toCompany)
  }
}
</script>

<template>
  <section class="form-section">
    <h3 class="section-title">BILL TO</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="toCompany">COMPANY</label>
        <input
          id="toCompany"
          v-model="invoiceStore.form.toCompany"
          @blur="handleCompanyBlur"
          type="text"
          placeholder="Client company name"
        />
      </div>
      <div class="form-group">
        <label for="toNames">CONTACT NAMES</label>
        <input
          id="toNames"
          v-model="invoiceStore.form.toNames"
          type="text"
          placeholder="John Doe, Jane Smith"
        />
      </div>
      <div class="form-group full-width">
        <label for="toAddress">ADDRESS</label>
        <textarea
          id="toAddress"
          v-model="invoiceStore.form.toAddress"
          placeholder="Client address"
          rows="2"
        ></textarea>
      </div>
      <div class="form-group full-width">
        <label for="toContact">CONTACT INFO</label>
        <input
          id="toContact"
          v-model="invoiceStore.form.toContact"
          type="text"
          placeholder="Email or phone"
        />
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

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid var(--border);
  background: var(--ui-bg);
  min-height: 36px;
}

.form-group textarea {
  min-height: 60px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--ui-fg);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

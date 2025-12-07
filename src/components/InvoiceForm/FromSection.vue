<script setup>
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()
</script>

<template>
  <section class="form-section">
    <h3 class="section-title">FROM</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="fromName">NAME</label>
        <input
          id="fromName"
          v-model="invoiceStore.form.fromName"
          type="text"
          placeholder="Your name or company"
        />
      </div>
      <div class="form-group">
        <label for="fromWebsite">WEBSITE</label>
        <input
          id="fromWebsite"
          v-model="invoiceStore.form.fromWebsite"
          type="text"
          placeholder="www.example.com"
        />
      </div>
      <div class="form-group">
        <label for="fromPhone">PHONE</label>
        <input
          id="fromPhone"
          v-model="invoiceStore.form.fromPhone"
          type="text"
          placeholder="+1 (555) 000-0000"
        />
      </div>
      <div class="form-group full-width">
        <label for="fromAddress">ADDRESS</label>
        <textarea
          id="fromAddress"
          v-model="invoiceStore.form.fromAddress"
          placeholder="Your address"
          rows="2"
        ></textarea>
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

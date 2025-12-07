<script setup>
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()
</script>

<template>
  <section class="form-section">
    <h3 class="section-title">PAYMENT INSTRUCTIONS</h3>
    <div class="form-group">
      <textarea
        id="paymentInstructions"
        v-model="invoiceStore.form.paymentInstructions"
        placeholder="Bank details, payment methods, or any other payment instructions..."
        rows="4"
      ></textarea>
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

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group textarea {
  padding: 10px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid var(--border);
  background: var(--ui-bg);
  min-height: 100px;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--ui-fg);
}
</style>

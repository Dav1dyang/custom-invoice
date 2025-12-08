<script setup>
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()
</script>

<template>
  <section class="form-section">
    <h3 class="section-title">NOTES</h3>
    <div class="notes-position">
      <label class="radio-label">
        <input
          type="radio"
          v-model="invoiceStore.form.notesPosition"
          value="above"
        />
        Above Items
      </label>
      <label class="radio-label">
        <input
          type="radio"
          v-model="invoiceStore.form.notesPosition"
          value="below"
        />
        Below Items
      </label>
    </div>
    <div class="form-group">
      <textarea
        id="invoiceNotes"
        v-model="invoiceStore.form.invoiceNotes"
        placeholder="Additional notes or special instructions..."
        rows="3"
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

.notes-position {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-body);
  cursor: pointer;
}

.radio-label input[type="radio"] {
  cursor: pointer;
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
  min-height: 80px;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--ui-fg);
}
</style>

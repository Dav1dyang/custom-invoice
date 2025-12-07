<script setup>
import { onMounted } from 'vue'
import { useInvoiceStore } from '../stores/invoiceStore'
import TemplateSection from '../components/Template/TemplateSection.vue'
import FromSection from '../components/InvoiceForm/FromSection.vue'
import BillToSection from '../components/InvoiceForm/BillToSection.vue'
import InvoiceDetails from '../components/InvoiceForm/InvoiceDetails.vue'
import PaymentSection from '../components/InvoiceForm/PaymentSection.vue'
import NotesSection from '../components/InvoiceForm/NotesSection.vue'
import LineItems from '../components/InvoiceForm/LineItems.vue'
import PdfSettings from '../components/InvoiceForm/PdfSettings.vue'
import InvoicePreview from '../components/Preview/InvoicePreview.vue'
import CalendarImport from '../components/Calendar/CalendarImport.vue'

const invoiceStore = useInvoiceStore()

onMounted(async () => {
  await invoiceStore.loadTemplates()
  invoiceStore.setDueDate(30)
})
</script>

<template>
  <div class="invoice-view">
    <!-- Left column: Form -->
    <div class="form-column">
      <!-- Template Section -->
      <TemplateSection />

      <!-- FROM Section -->
      <FromSection />

      <!-- BILL TO Section -->
      <BillToSection />

      <!-- Invoice Details -->
      <InvoiceDetails />

      <!-- Payment Instructions -->
      <PaymentSection />

      <!-- Notes Section -->
      <NotesSection />

      <!-- Line Items -->
      <LineItems />

      <!-- Calendar Import -->
      <CalendarImport />

      <!-- PDF Settings -->
      <PdfSettings />
    </div>

    <!-- Right column: Preview -->
    <div class="preview-column">
      <InvoicePreview />
    </div>
  </div>
</template>

<style scoped>
.invoice-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-column {
  position: sticky;
  top: 24px;
  height: fit-content;
}

@media (max-width: 1199px) {
  .invoice-view {
    grid-template-columns: 1fr;
  }

  .preview-column {
    position: static;
    order: -1;
  }
}
</style>

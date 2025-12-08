<script setup>
import { ref } from 'vue'
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()

const typeOptions = ['Labor', 'Materials', 'Equipment', 'Consulting', 'Design', 'Development']

// Drag and drop
const draggedIndex = ref(null)

function handleDragStart(index, event) {
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function handleDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function handleDrop(targetIndex) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return

  const items = [...invoiceStore.lineItems]
  const [removed] = items.splice(draggedIndex.value, 1)
  items.splice(targetIndex, 0, removed)
  invoiceStore.lineItems = items
  draggedIndex.value = null
}

function handleDragEnd() {
  draggedIndex.value = null
}
</script>

<template>
  <section class="form-section">
    <div class="section-header">
      <h3 class="section-title">LINE ITEMS</h3>
    </div>

    <div class="table-wrapper">
      <table class="items-table">
        <thead>
          <tr>
            <th class="drag-col"></th>
            <th class="type-col" v-if="invoiceStore.hasAnyTypes">TYPE</th>
            <th class="desc-col">DESCRIPTION</th>
            <th class="qty-col">QTY/HRS</th>
            <th class="rate-col">RATE</th>
            <th class="amt-col">AMOUNT</th>
            <th class="action-col"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in invoiceStore.lineItems"
            :key="index"
            draggable="true"
            @dragstart="handleDragStart(index, $event)"
            @dragover="handleDragOver"
            @drop="handleDrop(index)"
            @dragend="handleDragEnd"
            :class="{ dragging: draggedIndex === index }"
          >
            <td class="drag-handle">
              <span class="drag-icon">⋮⋮</span>
            </td>
            <td class="type-cell" v-if="invoiceStore.hasAnyTypes">
              <input
                :value="item.type"
                @input="invoiceStore.updateLineItem(index, 'type', $event.target.value)"
                type="text"
                list="typeOptions"
                placeholder="Type..."
              />
              <datalist id="typeOptions">
                <option v-for="opt in typeOptions" :key="opt" :value="opt" />
              </datalist>
            </td>
            <td class="type-cell" v-else>
              <input
                :value="item.type"
                @input="invoiceStore.updateLineItem(index, 'type', $event.target.value)"
                type="text"
                list="typeOptions"
                placeholder="Type..."
              />
            </td>
            <td>
              <input
                :value="item.description"
                @input="invoiceStore.updateLineItem(index, 'description', $event.target.value)"
                type="text"
                placeholder="Description..."
              />
            </td>
            <td class="center">
              <input
                :value="item.qty"
                @input="invoiceStore.updateLineItem(index, 'qty', $event.target.value)"
                type="number"
                step="0.01"
                placeholder="Qty"
              />
            </td>
            <td class="right">
              <input
                :value="item.rate"
                @input="invoiceStore.updateLineItem(index, 'rate', $event.target.value)"
                type="number"
                step="0.01"
                placeholder="Rate"
              />
            </td>
            <td class="right amount">
              {{ invoiceStore.form.currency === 'USD' ? '$' : '' }}{{ item.amount }}
            </td>
            <td class="action-cell">
              <button @click="invoiceStore.removeLineItem(index)" class="rm">×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="items-footer">
      <button @click="invoiceStore.addLineItem()" class="btn-add">
        + ADD LINE ITEM
      </button>
      <label class="save-items-checkbox">
        <input type="checkbox" v-model="invoiceStore.saveLineItemsWithTemplate" />
        Save items with template
      </label>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: var(--font-size-h3);
  font-weight: 700;
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 8px;
  text-align: left;
  border: 1px solid var(--border);
}

.items-table th {
  font-size: var(--font-size-label);
  font-weight: 500;
  background: var(--hover);
}

.drag-col {
  width: 30px;
}

.type-col {
  width: 13%;
}

.desc-col {
  width: 42%;
}

.qty-col,
.rate-col {
  width: 12%;
}

.amt-col {
  width: 15%;
}

.action-col {
  width: 40px;
}

.drag-handle {
  cursor: grab;
  text-align: center;
  user-select: none;
}

.drag-icon {
  opacity: 0.5;
}

.items-table tr:hover .drag-icon {
  opacity: 1;
}

.items-table tr.dragging {
  opacity: 0.5;
}

.items-table input {
  width: 100%;
  padding: 8px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid transparent;
  background: transparent;
}

.items-table input:focus {
  border-color: var(--border);
  outline: none;
}

.center {
  text-align: center;
}

.center input {
  text-align: center;
}

.right {
  text-align: right;
}

.right input {
  text-align: right;
}

.amount {
  font-weight: 700;
}

.action-cell {
  padding: 0 !important;
}

.rm {
  width: 100%;
  height: 100%;
  min-height: 44px;
  background: var(--ui-fg);
  color: var(--ui-bg);
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
}

.rm:hover {
  background: #dc2626;
}

.items-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.btn-add {
  padding: 10px 20px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
}

.btn-add:hover {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.save-items-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-label);
  cursor: pointer;
}

@media (max-width: 768px) {
  .items-footer {
    flex-direction: column;
    gap: 12px;
  }

  .btn-add {
    width: 100%;
  }

  .save-items-checkbox {
    justify-content: center;
  }
}
</style>

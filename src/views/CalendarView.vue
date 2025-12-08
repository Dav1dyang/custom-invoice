<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInvoiceStore } from '../stores/invoiceStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const invoiceStore = useInvoiceStore()
const authStore = useAuthStore()

const startDate = ref('')
const endDate = ref('')
const events = ref([])
const parsedItems = ref([])
const loading = ref(false)
const error = ref('')
const step = ref(1) // 1: Select dates, 2: Review events, 3: Confirm items

const defaultRate = ref(75)

async function fetchCalendarEvents() {
  if (!startDate.value || !endDate.value) {
    error.value = 'Please select both start and end dates'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.session?.access_token}`
      },
      body: JSON.stringify({
        startDate: startDate.value,
        endDate: endDate.value
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to fetch calendar events')
    }

    const data = await response.json()
    events.value = data.events || []
    step.value = 2
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function parseEventsWithAI() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/ai/parse-calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.session?.access_token}`
      },
      body: JSON.stringify({
        events: events.value,
        defaultRate: defaultRate.value
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to parse events')
    }

    const data = await response.json()
    parsedItems.value = data.lineItems || []
    step.value = 3
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function updateParsedItem(index, field, value) {
  parsedItems.value[index][field] = value
  if (field === 'qty' || field === 'rate') {
    const item = parsedItems.value[index]
    const qty = parseFloat(item.qty) || 0
    const rate = parseFloat(item.rate) || 0
    parsedItems.value[index].amount = (qty * rate).toFixed(2)
  }
}

function removeParsedItem(index) {
  parsedItems.value.splice(index, 1)
}

function applyToInvoice() {
  // Add parsed items to invoice store
  parsedItems.value.forEach(item => {
    invoiceStore.addLineItem(item.description, item.qty, item.rate, item.type)
  })

  // Navigate back to invoice
  router.push('/')
}

function goBack() {
  if (step.value > 1) {
    step.value--
  }
}

const totalHours = computed(() => {
  return parsedItems.value.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0)
})

const totalAmount = computed(() => {
  return parsedItems.value.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
})
</script>

<template>
  <div class="calendar-view">
    <div class="calendar-card">
      <div class="card-header">
        <h2>Import from Google Calendar</h2>
        <p class="subtitle">Automatically generate line items from your calendar events</p>
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Step 1: Select date range -->
      <div v-if="step === 1" class="step-content">
        <h3>Step 1: Select Date Range</h3>

        <div class="date-inputs">
          <div class="form-group">
            <label>START DATE</label>
            <input type="date" v-model="startDate" class="form-input" />
          </div>
          <div class="form-group">
            <label>END DATE</label>
            <input type="date" v-model="endDate" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label>DEFAULT HOURLY RATE ($)</label>
          <input
            type="number"
            v-model="defaultRate"
            step="0.01"
            class="form-input"
            style="max-width: 150px"
          />
        </div>

        <button
          @click="fetchCalendarEvents"
          :disabled="loading"
          class="btn-primary"
        >
          {{ loading ? 'Fetching...' : 'Fetch Calendar Events' }}
        </button>
      </div>

      <!-- Step 2: Review events -->
      <div v-if="step === 2" class="step-content">
        <h3>Step 2: Review Calendar Events</h3>
        <p class="step-info">Found {{ events.length }} events in the selected date range</p>

        <div class="events-list" v-if="events.length > 0">
          <div v-for="(event, index) in events" :key="index" class="event-item">
            <div class="event-title">{{ event.summary || 'Untitled Event' }}</div>
            <div class="event-time">
              {{ event.start?.dateTime || event.start?.date }} -
              {{ event.end?.dateTime || event.end?.date }}
            </div>
            <div class="event-duration" v-if="event.duration">
              Duration: {{ event.duration }} hours
            </div>
          </div>
        </div>

        <div v-else class="no-events">
          No events found in the selected date range
        </div>

        <div class="step-actions">
          <button @click="goBack" class="btn-secondary">Back</button>
          <button
            @click="parseEventsWithAI"
            :disabled="loading || events.length === 0"
            class="btn-primary"
          >
            {{ loading ? 'Parsing with AI...' : 'Parse Events with AI' }}
          </button>
        </div>
      </div>

      <!-- Step 3: Confirm line items -->
      <div v-if="step === 3" class="step-content">
        <h3>Step 3: Review & Confirm Line Items</h3>
        <p class="step-info">AI has parsed your events into {{ parsedItems.length }} line items</p>

        <div class="parsed-items" v-if="parsedItems.length > 0">
          <table class="items-table">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>DESCRIPTION</th>
                <th>HRS</th>
                <th>RATE</th>
                <th>AMOUNT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in parsedItems" :key="index">
                <td>
                  <input
                    type="text"
                    :value="item.type"
                    @input="updateParsedItem(index, 'type', $event.target.value)"
                    class="table-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    :value="item.description"
                    @input="updateParsedItem(index, 'description', $event.target.value)"
                    class="table-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    :value="item.qty"
                    @input="updateParsedItem(index, 'qty', $event.target.value)"
                    step="0.01"
                    class="table-input number"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    :value="item.rate"
                    @input="updateParsedItem(index, 'rate', $event.target.value)"
                    step="0.01"
                    class="table-input number"
                  />
                </td>
                <td class="amount">${{ item.amount }}</td>
                <td>
                  <button @click="removeParsedItem(index)" class="btn-remove">×</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="totals-label">TOTALS</td>
                <td class="total-hours">{{ totalHours.toFixed(2) }}</td>
                <td></td>
                <td class="total-amount">${{ totalAmount.toFixed(2) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="step-actions">
          <button @click="goBack" class="btn-secondary">Back</button>
          <button
            @click="applyToInvoice"
            :disabled="parsedItems.length === 0"
            class="btn-primary"
          >
            Add to Invoice
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  max-width: 900px;
  margin: 0 auto;
}

.calendar-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  padding: 24px;
}

.card-header {
  margin-bottom: 24px;
}

.card-header h2 {
  font-size: var(--font-size-h1);
  margin: 0 0 8px;
}

.subtitle {
  color: var(--muted);
  font-size: var(--font-size-body);
  margin: 0;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 12px;
  margin-bottom: 16px;
}

.step-content h3 {
  font-size: var(--font-size-h3);
  margin: 0 0 16px;
}

.step-info {
  color: var(--muted);
  font-size: var(--font-size-body);
  margin: 0 0 16px;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.form-input {
  padding: 12px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid var(--border);
  background: var(--ui-bg);
}

.btn-primary {
  padding: 12px 24px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: var(--ui-fg);
  color: var(--ui-bg);
  border: 1px solid var(--ui-fg);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: transparent;
  color: var(--ui-fg);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: transparent;
  color: var(--ui-fg);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--hover);
}

.events-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border);
  margin-bottom: 16px;
}

.event-item {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.event-item:last-child {
  border-bottom: none;
}

.event-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.event-time,
.event-duration {
  font-size: var(--font-size-label);
  color: var(--muted);
}

.no-events {
  padding: 24px;
  text-align: center;
  color: var(--muted);
  border: 1px solid var(--border);
  margin-bottom: 16px;
}

.step-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
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

.table-input {
  width: 100%;
  padding: 8px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid transparent;
  background: transparent;
}

.table-input:focus {
  border-color: var(--border);
  outline: none;
}

.table-input.number {
  text-align: right;
  width: 80px;
}

.amount {
  text-align: right;
  font-weight: 500;
}

.btn-remove {
  width: 30px;
  height: 30px;
  background: var(--ui-fg);
  color: var(--ui-bg);
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.btn-remove:hover {
  background: #dc2626;
}

.totals-label {
  text-align: right;
  font-weight: 500;
}

.total-hours,
.total-amount {
  text-align: right;
  font-weight: 700;
}

@media (max-width: 768px) {
  .date-inputs {
    grid-template-columns: 1fr;
  }
}
</style>

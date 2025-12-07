<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToCalendar() {
  router.push('/calendar')
}
</script>

<template>
  <details class="form-section collapsible">
    <summary class="section-summary">
      <h3 class="section-title">IMPORT FROM CALENDAR</h3>
    </summary>

    <div class="section-content">
      <p class="description">
        Connect to Google Calendar and automatically generate line items from your scheduled events.
        AI will parse event titles, calculate hours, and suggest categories.
      </p>

      <button @click="goToCalendar" class="btn-calendar">
        Open Calendar Import
      </button>
    </div>
  </details>
</template>

<style scoped>
.form-section.collapsible {
  padding: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.section-summary {
  padding: 16px;
  cursor: pointer;
  list-style: none;
}

.section-summary::-webkit-details-marker {
  display: none;
}

.section-summary::before {
  content: '▶ ';
  font-size: 10px;
}

details[open] .section-summary::before {
  content: '▼ ';
}

.section-title {
  display: inline;
  font-size: var(--font-size-h3);
  font-weight: 700;
  margin: 0;
}

.section-content {
  padding: 0 16px 16px;
}

.description {
  font-size: var(--font-size-body);
  color: var(--muted);
  margin: 0 0 16px;
  line-height: 1.5;
}

.btn-calendar {
  width: 100%;
  padding: 12px 24px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
}

.btn-calendar:hover {
  background: var(--ui-fg);
  color: var(--ui-bg);
}
</style>

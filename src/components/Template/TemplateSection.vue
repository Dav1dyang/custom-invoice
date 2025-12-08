<script setup>
import { ref, computed } from 'vue'
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()

const dropdownOpen = ref(false)

const starredTemplates = computed(() => invoiceStore.starredTemplates)
const recentTemplate = computed(() => invoiceStore.recentTemplate)
const allTemplates = computed(() => Object.keys(invoiceStore.templates).sort())

const templateExists = computed(() => {
  const name = invoiceStore.selectedTemplate
  return name && invoiceStore.templates[name]
})

const isStarred = computed(() => {
  return starredTemplates.value.includes(invoiceStore.selectedTemplate)
})

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function selectTemplate(name) {
  invoiceStore.selectedTemplate = name
  dropdownOpen.value = false
}

function loadTemplate() {
  const name = invoiceStore.selectedTemplate
  if (name && invoiceStore.templates[name]) {
    invoiceStore.loadTemplate(name)
  }
}

async function saveTemplate() {
  let name = invoiceStore.selectedTemplate
  if (!name) {
    name = prompt('Enter template name:')
    if (!name) return
  }

  if (invoiceStore.templates[name]) {
    if (!confirm(`Update template "${name}"?`)) return
  }

  await invoiceStore.saveTemplate(name)
}

async function toggleStar() {
  const name = invoiceStore.selectedTemplate
  if (name) {
    await invoiceStore.toggleStar(name)
  }
}

async function deleteTemplate() {
  const name = invoiceStore.selectedTemplate
  if (name && confirm(`Delete template "${name}"?`)) {
    await invoiceStore.deleteTemplate(name)
  }
}

function closeDropdown(e) {
  if (!e.target.closest('.template-input-group')) {
    dropdownOpen.value = false
  }
}
</script>

<template>
  <section class="form-section template-section">
    <div class="template-row">
      <!-- Quick access chips -->
      <div class="template-chips">
        <button
          v-for="name in starredTemplates"
          :key="name"
          @click="selectTemplate(name); loadTemplate()"
          class="filter-chip"
          :class="{ active: invoiceStore.selectedTemplate === name }"
        >
          {{ name }}
        </button>
        <button
          v-if="recentTemplate && !starredTemplates.includes(recentTemplate)"
          @click="selectTemplate(recentTemplate); loadTemplate()"
          class="filter-chip recent-chip"
          :class="{ active: invoiceStore.selectedTemplate === recentTemplate }"
        >
          {{ recentTemplate }}
        </button>
      </div>

      <!-- Template input with dropdown -->
      <div class="template-input-group" v-click-outside="closeDropdown">
        <input
          type="text"
          v-model="invoiceStore.selectedTemplate"
          placeholder="Template name..."
          class="template-input"
        />
        <button @click="toggleDropdown" class="dropdown-toggle">▼</button>

        <!-- Dropdown -->
        <div v-if="dropdownOpen" class="template-dropdown">
          <div class="template-dropdown-content">
            <!-- Starred -->
            <div v-if="starredTemplates.length > 0" class="template-dropdown-section">
              <div class="template-dropdown-section-title">★ STARRED</div>
              <div
                v-for="name in starredTemplates"
                :key="name"
                @click="selectTemplate(name)"
                class="template-dropdown-item starred"
              >
                {{ name }}
              </div>
            </div>

            <!-- Recent -->
            <div v-if="recentTemplate && !starredTemplates.includes(recentTemplate)" class="template-dropdown-section">
              <div class="template-dropdown-section-title">⏱ RECENT</div>
              <div
                @click="selectTemplate(recentTemplate)"
                class="template-dropdown-item"
              >
                {{ recentTemplate }}
              </div>
            </div>

            <!-- All Templates -->
            <div v-if="allTemplates.length > 0" class="template-dropdown-section">
              <div class="template-dropdown-section-title">📁 ALL TEMPLATES</div>
              <div
                v-for="name in allTemplates.filter(t => !starredTemplates.includes(t) && t !== recentTemplate)"
                :key="name"
                @click="selectTemplate(name)"
                class="template-dropdown-item"
              >
                {{ name }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="template-actions">
        <button @click="loadTemplate" class="action-btn" title="Load template" :disabled="!templateExists">
          <span>📂</span>
        </button>
        <button @click="saveTemplate" class="action-btn" title="Save template">
          <span>💾</span>
        </button>
        <button
          v-if="templateExists"
          @click="toggleStar"
          class="action-btn"
          :class="{ starred: isStarred }"
          :title="isStarred ? 'Remove star' : 'Add star'"
        >
          <span>{{ isStarred ? '★' : '☆' }}</span>
        </button>
        <button
          v-if="templateExists"
          @click="deleteTemplate"
          class="action-btn delete"
          title="Delete template"
        >
          <span>🗑️</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.template-section {
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.template-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.template-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 8px 16px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
}

.filter-chip:hover,
.filter-chip.active {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.recent-chip {
  border-style: dashed;
}

.template-input-group {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 200px;
}

.template-input {
  flex: 1;
  padding: 8px 12px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid var(--border);
  border-right: none;
  min-height: 40px;
}

.dropdown-toggle {
  padding: 0 12px;
  font-size: var(--font-size-body);
  background: var(--hover);
  border: 1px solid var(--border);
  cursor: pointer;
  min-height: 40px;
}

.dropdown-toggle:hover {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.template-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-top: none;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.template-dropdown-section {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.template-dropdown-section:last-child {
  border-bottom: none;
}

.template-dropdown-section-title {
  padding: 4px 12px;
  font-size: var(--font-size-label);
  color: var(--muted);
}

.template-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-dropdown-item:hover {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.template-dropdown-item.starred::before {
  content: '★ ';
  color: #f59e0b;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.starred span {
  color: #f59e0b;
}

.action-btn.delete:hover {
  background: #dc2626;
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .template-row {
    flex-direction: column;
    align-items: stretch;
  }

  .template-chips {
    justify-content: center;
  }

  .template-input-group {
    order: 1;
  }

  .template-actions {
    justify-content: center;
    order: 2;
  }
}
</style>

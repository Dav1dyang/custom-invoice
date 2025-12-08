<script setup>
import { ref } from 'vue'
import { useInvoiceStore } from '../../stores/invoiceStore'

const invoiceStore = useInvoiceStore()

const colorPresets = {
  technical: '#111111',
  blueprint: '#0B4C8C',
  neon: '#CEFF00',
  orange: '#D45500',
  purple: '#7B2CBF',
  red: '#DC2626'
}

const activePreset = ref('neon')

function setPreset(preset) {
  activePreset.value = preset
  invoiceStore.form.accentColor = colorPresets[preset]
}

function handleLogoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target.result
    const img = new Image()
    img.onload = () => {
      invoiceStore.setLogo(dataUrl, {
        w: img.naturalWidth,
        h: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight
      })
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <details class="form-section collapsible">
    <summary class="section-summary">
      <h3 class="section-title">PDF SETTINGS</h3>
    </summary>

    <div class="section-content">
      <div class="settings-grid">
        <!-- Paper Size -->
        <div class="form-group">
          <label for="paperSize">PAPER SIZE</label>
          <select id="paperSize" v-model="invoiceStore.form.paperSize">
            <option value="letter">Letter (8.5" × 11")</option>
            <option value="a4">A4 (210mm × 297mm)</option>
            <option value="legal">Legal (8.5" × 14")</option>
          </select>
        </div>

        <!-- Orientation -->
        <div class="form-group">
          <label for="orientation">ORIENTATION</label>
          <select id="orientation" v-model="invoiceStore.form.orientation">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <!-- Style Mode -->
        <div class="form-group">
          <label for="styleMode">STYLE</label>
          <select id="styleMode" v-model="invoiceStore.form.styleMode">
            <option value="outline">Outline (Technical)</option>
            <option value="filled">Filled (Datasheet)</option>
            <option value="ascii">ASCII (Terminal)</option>
          </select>
        </div>

        <!-- Accent Color -->
        <div class="form-group">
          <label>ACCENT COLOR</label>
          <div class="color-row">
            <input
              type="color"
              v-model="invoiceStore.form.accentColor"
              class="color-picker"
            />
            <input
              type="text"
              v-model="invoiceStore.form.accentColor"
              class="hex-input"
              maxlength="7"
            />
          </div>
        </div>
      </div>

      <!-- Color Presets -->
      <div class="presets-section">
        <label class="presets-label">PRESETS</label>
        <div class="preset-buttons">
          <button
            v-for="(color, name) in colorPresets"
            :key="name"
            @click="setPreset(name)"
            class="preset-btn"
            :class="{ active: activePreset === name }"
            :style="{ '--preset-color': color }"
          >
            <span class="preset-swatch" :style="{ background: color }"></span>
            {{ name }}
          </button>
        </div>
      </div>

      <!-- Logo Upload -->
      <div class="logo-section">
        <label class="logo-label">LOGO</label>
        <div class="logo-row">
          <input
            type="file"
            @change="handleLogoUpload"
            accept="image/*"
            class="logo-input"
          />
          <div v-if="invoiceStore.logoDataUrl" class="logo-preview">
            <img :src="invoiceStore.logoDataUrl" alt="Logo preview" />
            <button @click="invoiceStore.clearLogo()" class="clear-logo">×</button>
          </div>
        </div>
      </div>
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

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
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

.form-group select,
.form-group input {
  padding: 10px;
  font-size: var(--font-size-body);
  font-family: inherit;
  border: 1px solid var(--border);
  background: var(--ui-bg);
  min-height: 36px;
}

.color-row {
  display: flex;
  gap: 8px;
}

.color-picker {
  width: 50px;
  height: 36px;
  padding: 2px;
  cursor: pointer;
}

.hex-input {
  flex: 1;
  text-transform: uppercase;
}

.presets-section {
  margin-bottom: 16px;
}

.presets-label {
  font-size: var(--font-size-label);
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: var(--font-size-button);
  font-family: inherit;
  text-transform: capitalize;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover,
.preset-btn.active {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.preset-swatch {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border);
}

.logo-section {
  margin-bottom: 16px;
}

.logo-label {
  font-size: var(--font-size-label);
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-input {
  flex: 1;
}

.logo-preview {
  position: relative;
  width: 60px;
  height: 40px;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: 1px solid var(--border);
}

.clear-logo {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>

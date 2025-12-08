import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase'

export const useInvoiceStore = defineStore('invoice', () => {
  // Form state
  const form = ref({
    // From section
    fromName: '',
    fromWebsite: '',
    fromPhone: '',
    fromAddress: '',
    // Bill To section
    toCompany: '',
    toNames: '',
    toAddress: '',
    toContact: '',
    // Invoice details
    companyAbbrev: '',
    invoiceSequence: '',
    invoiceTitle: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'USD',
    // Payment
    paymentInstructions: '',
    // Notes
    invoiceNotes: '',
    notesPosition: 'above',
    // PDF settings
    paperSize: 'letter',
    orientation: 'portrait',
    styleMode: 'outline',
    accentColor: '#CEFF00'
  })

  // Line items
  const lineItems = ref([
    { type: '', description: '', qty: '', rate: '', amount: '0.00' }
  ])

  // Logo
  const logoDataUrl = ref(null)
  const logoNatural = ref(null)

  // Template state
  const templates = ref({})
  const starredTemplates = ref([])
  const recentTemplate = ref('')
  const selectedTemplate = ref('')
  const saveLineItemsWithTemplate = ref(true)

  // Loading states
  const loading = ref(false)
  const templatesLoaded = ref(false)

  // Computed
  const invoiceNumber = computed(() => {
    const abbrev = form.value.companyAbbrev || 'XXX'
    const seq = form.value.invoiceSequence || '01'
    return `IN-${abbrev}-${seq}`
  })

  const hasAnyTypes = computed(() => {
    return lineItems.value.some(item => item.type && item.type.trim())
  })

  const subtotal = computed(() => {
    return lineItems.value.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0)
    }, 0)
  })

  const subtotalsByType = computed(() => {
    const groups = {}
    let uncategorized = 0

    lineItems.value.forEach(item => {
      const amount = parseFloat(item.amount) || 0
      if (item.type && item.type.trim()) {
        const type = item.type.trim()
        groups[type] = (groups[type] || 0) + amount
      } else {
        uncategorized += amount
      }
    })

    return { groups, uncategorized, hasTypes: Object.keys(groups).length > 0 }
  })

  // Actions
  function addLineItem(desc = '', qty = '', rate = '', type = '') {
    const amount = ((parseFloat(qty) || 0) * (parseFloat(rate) || 0)).toFixed(2)
    lineItems.value.push({ type, description: desc, qty, rate, amount })
  }

  function removeLineItem(index) {
    lineItems.value.splice(index, 1)
    if (lineItems.value.length === 0) {
      addLineItem()
    }
  }

  function updateLineItem(index, field, value) {
    lineItems.value[index][field] = value
    // Recalculate amount if qty or rate changed
    if (field === 'qty' || field === 'rate') {
      const item = lineItems.value[index]
      const qty = parseFloat(item.qty) || 0
      const rate = parseFloat(item.rate) || 0
      lineItems.value[index].amount = (qty * rate).toFixed(2)
    }
  }

  function clearAllItems() {
    lineItems.value = [{ type: '', description: '', qty: '', rate: '', amount: '0.00' }]
  }

  function setLogo(dataUrl, natural) {
    logoDataUrl.value = dataUrl
    logoNatural.value = natural
  }

  function clearLogo() {
    logoDataUrl.value = null
    logoNatural.value = null
  }

  // Generate abbreviation from company name
  function generateAbbreviation(name) {
    if (!name || !name.trim()) return ''

    const skipWords = ['the', 'a', 'an', 'and', 'of', 'for', 'to', 'in', 'on', 'at', 'foundation']
    const words = name.toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0 && !skipWords.includes(word.toLowerCase()))

    return words.map(w => w[0]).join('').slice(0, 6)
  }

  function setDueDate(days) {
    const invoiceDate = new Date(form.value.invoiceDate || new Date())
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + days)

    const yyyy = dueDate.getFullYear()
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0')
    const dd = String(dueDate.getDate()).padStart(2, '0')
    form.value.dueDate = `${yyyy}-${mm}-${dd}`
  }

  // Template management
  async function loadTemplates() {
    if (templatesLoaded.value) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      templates.value = {}
      data.forEach(t => {
        templates.value[t.name] = t.data
        templates.value[t.name]._id = t.id
        templates.value[t.name]._starred = t.is_starred
      })

      // Load starred templates
      starredTemplates.value = data
        .filter(t => t.is_starred)
        .map(t => t.name)
        .slice(0, 3)

      templatesLoaded.value = true
    } catch (e) {
      console.error('Error loading templates:', e)
    } finally {
      loading.value = false
    }
  }

  async function saveTemplate(name) {
    loading.value = true
    try {
      const templateData = {
        ...form.value,
        lineItems: saveLineItemsWithTemplate.value ? lineItems.value : [],
        logoDataUrl: logoDataUrl.value,
        saveLineItems: saveLineItemsWithTemplate.value
      }

      const existing = templates.value[name]

      if (existing && existing._id) {
        // Update existing
        const { error } = await supabase
          .from('templates')
          .update({
            data: templateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing._id)

        if (error) throw error
      } else {
        // Create new
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
          .from('templates')
          .insert({
            name,
            data: templateData,
            user_id: user.id,
            is_starred: false
          })

        if (error) throw error
      }

      // Reload templates
      templatesLoaded.value = false
      await loadTemplates()
      selectedTemplate.value = name
    } catch (e) {
      console.error('Error saving template:', e)
    } finally {
      loading.value = false
    }
  }

  async function deleteTemplate(name) {
    loading.value = true
    try {
      const template = templates.value[name]
      if (!template || !template._id) return

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', template._id)

      if (error) throw error

      // Reload templates
      templatesLoaded.value = false
      await loadTemplates()

      if (selectedTemplate.value === name) {
        selectedTemplate.value = ''
      }
    } catch (e) {
      console.error('Error deleting template:', e)
    } finally {
      loading.value = false
    }
  }

  async function toggleStar(name) {
    loading.value = true
    try {
      const template = templates.value[name]
      if (!template || !template._id) return

      const isCurrentlyStarred = starredTemplates.value.includes(name)

      // Check max stars
      if (!isCurrentlyStarred && starredTemplates.value.length >= 3) {
        alert('Maximum 3 starred templates allowed')
        loading.value = false
        return
      }

      const { error } = await supabase
        .from('templates')
        .update({ is_starred: !isCurrentlyStarred })
        .eq('id', template._id)

      if (error) throw error

      // Reload templates
      templatesLoaded.value = false
      await loadTemplates()
    } catch (e) {
      console.error('Error toggling star:', e)
    } finally {
      loading.value = false
    }
  }

  function loadTemplateData(data) {
    // Load form fields
    Object.keys(form.value).forEach(key => {
      if (data[key] !== undefined) {
        form.value[key] = data[key]
      }
    })

    // Handle backwards compatibility for invoice number
    if (data.invoiceNumber && !data.companyAbbrev) {
      const parts = data.invoiceNumber.split('-')
      if (parts.length >= 2) {
        form.value.companyAbbrev = parts[1] || ''
        form.value.invoiceSequence = parts[2] || '01'
      }
    }

    // Load line items
    if (data.lineItems && data.lineItems.length > 0) {
      lineItems.value = data.lineItems.map(item => ({
        type: item.type || '',
        description: item.description || '',
        qty: item.qty || '',
        rate: item.rate || '',
        amount: item.amount || '0.00'
      }))
    }

    // Load logo
    if (data.logoDataUrl) {
      logoDataUrl.value = data.logoDataUrl
    }

    // Load checkbox state
    if (data.saveLineItems !== undefined) {
      saveLineItemsWithTemplate.value = data.saveLineItems
    }
  }

  function loadTemplate(name) {
    const template = templates.value[name]
    if (template) {
      loadTemplateData(template)
      recentTemplate.value = name
      selectedTemplate.value = name
    }
  }

  // Reset form
  function resetForm() {
    form.value = {
      fromName: '',
      fromWebsite: '',
      fromPhone: '',
      fromAddress: '',
      toCompany: '',
      toNames: '',
      toAddress: '',
      toContact: '',
      companyAbbrev: '',
      invoiceSequence: '',
      invoiceTitle: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      currency: 'USD',
      paymentInstructions: '',
      invoiceNotes: '',
      notesPosition: 'above',
      paperSize: 'letter',
      orientation: 'portrait',
      styleMode: 'outline',
      accentColor: '#CEFF00'
    }
    lineItems.value = [{ type: '', description: '', qty: '', rate: '', amount: '0.00' }]
    logoDataUrl.value = null
    logoNatural.value = null
    selectedTemplate.value = ''
    setDueDate(30)
  }

  return {
    // State
    form,
    lineItems,
    logoDataUrl,
    logoNatural,
    templates,
    starredTemplates,
    recentTemplate,
    selectedTemplate,
    saveLineItemsWithTemplate,
    loading,
    templatesLoaded,
    // Computed
    invoiceNumber,
    hasAnyTypes,
    subtotal,
    subtotalsByType,
    // Actions
    addLineItem,
    removeLineItem,
    updateLineItem,
    clearAllItems,
    setLogo,
    clearLogo,
    generateAbbreviation,
    setDueDate,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    toggleStar,
    loadTemplateData,
    loadTemplate,
    resetForm
  }
})

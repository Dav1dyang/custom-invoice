import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')

  async function initialize() {
    if (initialized.value) return

    loading.value = true
    try {
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null
      })
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function signInWithEmail(email) {
    loading.value = true
    error.value = null

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (signInError) throw signInError
      return { success: true, message: 'Check your email for the magic link!' }
    } catch (e) {
      error.value = e.message
      return { success: false, message: e.message }
    } finally {
      loading.value = false
    }
  }

  async function signInWithGoogle() {
    loading.value = true
    error.value = null

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'https://www.googleapis.com/auth/calendar.readonly'
        }
      })

      if (signInError) throw signInError
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
      session.value = null
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    session,
    loading,
    initialized,
    error,
    isAuthenticated,
    userEmail,
    initialize,
    signInWithEmail,
    signInWithGoogle,
    signOut
  }
})

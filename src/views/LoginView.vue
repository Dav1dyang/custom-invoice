<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const message = ref('')
const messageType = ref('')

async function handleEmailLogin() {
  if (!email.value) {
    message.value = 'Please enter your email'
    messageType.value = 'error'
    return
  }

  const result = await authStore.signInWithEmail(email.value)
  message.value = result.message
  messageType.value = result.success ? 'success' : 'error'
}

async function handleGoogleLogin() {
  await authStore.signInWithGoogle()
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">INVOICE TOOL</h1>
      <p class="login-subtitle">Sign in to access your invoices</p>

      <!-- Message display -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <!-- Email login -->
      <div class="login-form">
        <label for="email" class="form-label">EMAIL</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="your@email.com"
          class="form-input"
          @keyup.enter="handleEmailLogin"
        />
        <button
          @click="handleEmailLogin"
          :disabled="authStore.loading"
          class="btn-primary"
        >
          {{ authStore.loading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </div>

      <div class="divider">
        <span>or</span>
      </div>

      <!-- Google login -->
      <button
        @click="handleGoogleLogin"
        :disabled="authStore.loading"
        class="btn-google"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p class="login-note">
        Google login also grants calendar access for automatic invoice generation
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.login-title {
  font-size: var(--font-size-h1);
  font-weight: 700;
  margin: 0 0 8px;
  text-align: center;
}

.login-subtitle {
  font-size: var(--font-size-body);
  color: var(--muted);
  text-align: center;
  margin: 0 0 32px;
}

.message {
  padding: 12px;
  margin-bottom: 24px;
  font-size: var(--font-size-body);
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
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

.form-input:focus {
  outline: none;
  border-color: var(--ui-fg);
}

.btn-primary {
  padding: 12px 24px;
  font-size: var(--font-size-button);
  font-family: inherit;
  font-weight: 500;
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

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border);
}

.divider span {
  padding: 0 16px;
  font-size: var(--font-size-label);
  color: var(--muted);
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 24px;
  font-size: var(--font-size-button);
  font-family: inherit;
  background: white;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-google:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-note {
  margin-top: 24px;
  font-size: var(--font-size-label);
  color: var(--muted);
  text-align: center;
}
</style>

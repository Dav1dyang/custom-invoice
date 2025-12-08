<script setup>
import { useAuthStore } from './stores/authStore'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const userEmail = computed(() => authStore.userEmail)

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="app" :data-theme="'light'">
    <!-- Header -->
    <header class="app-header" v-if="isAuthenticated">
      <div class="header-left">
        <h1 class="app-title">INVOICE TOOL</h1>
      </div>
      <nav class="header-nav">
        <router-link to="/" class="nav-link">Invoice</router-link>
        <router-link to="/calendar" class="nav-link">Calendar</router-link>
      </nav>
      <div class="header-right">
        <span class="user-email">{{ userEmail }}</span>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </header>

    <!-- Main content -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--ui-bg);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  font-size: var(--font-size-h1);
  font-weight: 700;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  font-size: var(--font-size-body);
  color: var(--ui-fg);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover {
  background: var(--hover);
}

.nav-link.router-link-active {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-email {
  font-size: var(--font-size-label);
  color: var(--muted);
}

.logout-btn {
  font-size: var(--font-size-button);
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: var(--ui-fg);
  color: var(--ui-bg);
}

.app-main {
  flex: 1;
  padding: 24px;
}
</style>

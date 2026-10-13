import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import './assets/styles/main.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  // The rest of the site is light-only Bootstrap, so keep PrimeVue tables light even in OS dark mode
  app.use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: 'none' } } })

  const authStore = useAuthStore()
  await authStore.initAuth()

  app.mount('#app')
}

bootstrap()

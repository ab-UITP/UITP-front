import './styles/main.css'
import Aura from '@primevue/themes/aura'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient: new QueryClient() })
app.use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } })
app.mount('#app')

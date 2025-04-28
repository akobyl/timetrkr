import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Import Bootstrap JS for navbar toggler and modal support
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)

// Install Pinia
app.use(createPinia())

// Install Router
app.use(router)

app.mount('#app')
import { createPinia } from 'pinia'
import 'tw-elements'
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import './scope-extensions-js'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

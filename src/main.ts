import { createApp } from 'vue'
import App from './App.vue'
import DI from './plugins/di'
import './index.css'
import 'tw-elements'
import { createPinia } from 'pinia'


const app = createApp(App)
app.use(createPinia())
app.mount('#app')

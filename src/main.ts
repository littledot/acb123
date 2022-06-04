import { createApp } from 'vue'
import App from './App.vue'
import DI from './plugins/di'
import './index.css'
import 'tw-elements'


const app = createApp(App)
app.use(DI)
app.mount('#app')

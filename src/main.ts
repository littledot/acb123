import { createPinia } from 'pinia'
import 'tw-elements'
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import '@m/scope-extensions-js'

const app = createApp(App)
app.use(createPinia())
app.config.errorHandler = (err, instance, info) => {
  console.error(err, instance, info)
}
app.config.warnHandler = (msg, instance, trace) => {
  console.warn(msg, instance, trace)
}
app.mount('#app')

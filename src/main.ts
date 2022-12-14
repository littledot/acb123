import Router from '@/router'
import FirebasePlugin from '@m/plugins/firebase'
import '@m/scope-extensions-js'
import { createPinia } from 'pinia'
import 'tw-elements'
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'

if (process.env.NODE_ENV === 'development') {
  import('./index-dev.css')
}

createApp(App)
  .also(it => {
    it.config.errorHandler = (err, instance: any, info) => {
      console.error('Error Info:', info)
      console.error(err)
    }
    it.config.warnHandler = (msg, instance: any, trace) => {
      console.warn(msg, trace)
    }
  })
  .use(FirebasePlugin, {
    apiKey: "AIzaSyBYLxD0HzPds44mBVtL1wUfegO-zkkOGu8",
    authDomain: "acb123-691a7.firebaseapp.com",
    projectId: "acb123-691a7",
    storageBucket: "acb123-691a7.appspot.com",
    messagingSenderId: "797706459663",
    appId: "1:797706459663:web:7fa8fd8daaf8b692cd617a",
    measurementId: "G-N2QB25HNHY",
  })
  .use(Router)
  .use(createPinia())
  .mount('#app')

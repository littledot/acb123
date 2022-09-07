import { getValue, RemoteConfig } from '@firebase/remote-config'
import FirebasePlugin from '@m/plugins/firebase'
import RollbarPlugin from '@m/plugins/rollbar'
import '@m/scope-extensions-js'
import { createPinia } from 'pinia'
import 'tw-elements'
import { App as VueApp, createApp } from 'vue'
import App from './App.vue'
import './index.css'

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

    onRemoteConfigOk: (app: VueApp, rc: RemoteConfig) => {
      app.use(RollbarPlugin, {
        accessToken: getValue(rc, 'rollbarApiKey').asString(),
        captureIp: 'anonymize',
        captureUncaught: true,
        captureUnhandledRejections: true,
        // payload: {
        //   code_version: '0.0.1',
        // }
      })
    }
  })
  .use(createPinia())
  .mount('#app')

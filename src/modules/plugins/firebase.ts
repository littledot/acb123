import type { FirebaseOptions } from '@firebase/app'
import RollbarPlugin from '@m/plugins/rollbar'
import { App } from 'vue'


export default {
  install: (app: App, options: FirebaseOptions) => {
    console.info('init firebase')
    tryInstall(app, options)
      .then(() => console.info('init firebase ok'))
      .catch(() => console.warn('init firebase nok'))
  }
}

async function tryInstall(app: App, options: FirebaseOptions) {
  let { getAnalytics: getAnalytics, logEvent: logEvent } = await import("firebase/analytics")
  let { initializeApp: initializeApp } = await import("firebase/app")
  let { fetchAndActivate: fetchAndActivate, getRemoteConfig: getRemoteConfig, getValue: getValue } = await import("firebase/remote-config")

  const fire = initializeApp(options)
  const analytics = getAnalytics(fire)
  app.config.globalProperties.$ga = analytics

  let old = app.config.errorHandler
  app.config.errorHandler = (err: any, instance: any, info) => {
    let msg = err
    if (err.stack) {
      msg = [err, err.stack].join('\n')
    }
    logEvent(analytics, msg, { type: 'uncaughtError' })
    old?.(err, instance, info)
  }

  const remoteConfig = getRemoteConfig(fire)
  remoteConfig.settings.minimumFetchIntervalMillis = 3_600_000
  fetchAndActivate(remoteConfig).then(() => {
    app.config.globalProperties.$grc = remoteConfig
    app.use(RollbarPlugin, {
      accessToken: getValue(remoteConfig, 'rollbarApiKey').asString(),
      captureIp: 'anonymize',
      captureUncaught: true,
      captureUnhandledRejections: true,
      // payload: {
      //   code_version: '0.0.1',
      // }
    })
  })


}

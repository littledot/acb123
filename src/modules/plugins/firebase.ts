import { getAnalytics } from "firebase/analytics"
import { initializeApp } from "firebase/app"
import { fetchAndActivate, getRemoteConfig } from "firebase/remote-config"
import { App } from 'vue'


export default {
  install: (app: App, options: any) => {
    console.info('init firebase')

    const fire = initializeApp(options)
    const analytics = getAnalytics(fire)
    app.config.globalProperties.$ga = analytics
    options.onAnalyticsOk?.(app, analytics)

    const remoteConfig = getRemoteConfig(fire)
    remoteConfig.settings.minimumFetchIntervalMillis = 3_600_000
    fetchAndActivate(remoteConfig).then(() => {
      app.config.globalProperties.$grc = remoteConfig
      options.onRemoteConfigOk?.(app, remoteConfig)
    })
  }
}



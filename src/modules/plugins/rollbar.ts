import Rollbar from 'rollbar'
import { App } from 'vue'


export default {
  install: (app: App<Element>, options: Rollbar.Configuration) => {
    console.info('init rollbar')

    // Setup DI
    let rollbar = new Rollbar(options)
    app.config.globalProperties.$rollbar = rollbar
    app.provide('rollbar', rollbar)

    // Pipe errors to rollbar
    let oldErrHandler = app.config.errorHandler
    app.config.errorHandler = (err, instance: any, info) => {
      instance.$rollbar
        .configure({ payload: { vueInfo: info } })
        .error(err)
      oldErrHandler?.(err, instance, info)
    }
  }
}

import * as t from '@comp/type'
import * as u from '@comp/util'

export default {
  install: (app, options: any) => {
    app.provide(u.DI.Fx, new t.Forex())
  }
}

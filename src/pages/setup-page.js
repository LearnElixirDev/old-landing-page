import 'styles/global.scss'

import {setIconFn} from 'components'
import {setupGoogleAnalytics} from 'helpers/google-analytics'

export const setupPage = () => {
  setIconFn((iconName) => import(/* webpackMode: "eager" */ `assets/${iconName}.svg`))

  // if (process.env.NODE_ENV === 'production')
  import(/* webpackMode: "eager" */ 'autotrack')
    .then(setupGoogleAnalytics)
}

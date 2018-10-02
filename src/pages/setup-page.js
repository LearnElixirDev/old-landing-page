import 'styles/global.scss'

import {setIconFn} from 'components'

export const setupPage = () => setIconFn((iconName) =>
  import(/* webpackChunkName: "[request]" */ `assets/${iconName}.svg`))

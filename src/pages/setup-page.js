import 'styles/global.scss'

import {setIconFn} from 'components'

export const setupPage = () => setIconFn((iconName) =>
  import(/* webpackMode: "eager" */ `assets/${iconName}.svg`))

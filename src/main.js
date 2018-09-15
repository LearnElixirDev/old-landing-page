import 'styles/global.scss'

import {setIconMap} from 'components'

setIconMap((iconName) => import(/* webpackPrefetch: true, webpackChunkName: "[request]" */ `assets/${iconName}.svg`))

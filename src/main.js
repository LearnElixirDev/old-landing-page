import 'styles/global.scss'
import {MDCRipple} from '@material/ripple'

import {setIconMap} from 'components/icon'
import {NavBar} from 'components/nav-bar'

setIconMap((iconName) => import(`assets/${iconName}.svg`))

new NavBar({
  target: document.body
})

new MDCRipple(document.querySelector('.mdc-button'))

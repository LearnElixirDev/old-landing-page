import {setIconMap} from 'components/icon'
import {NavBar} from 'components/nav-bar'

setIconMap({
  'lure-logo': import('assets/lure-logo.svg')
})

const app = new NavBar({
  target: document.body
})

import {MDCRipple} from '@material/ripple'

export const addRipples = (selector) => Array.from(document.querySelectorAll(selector))
  .forEach((item) => new MDCRipple(item))

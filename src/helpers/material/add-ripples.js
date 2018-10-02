import {MDCRipple} from '@material/ripple'

import {isString} from 'helpers/util'

export const addRipple = (selector) => {
  let item

  if (isString(selector))
    item = document.querySelector(selector)
  else
    item = selector

  if (item)
    return new MDCRipple(item)
}

export const addRipples = (selector) => Array.from(document.querySelectorAll(selector))
  .forEach((item) => new MDCRipple(item))

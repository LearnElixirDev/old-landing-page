import {curry} from 'ramda'

export const removeClass = curry((klass, element) => {
  element.className = element.className.replace(new RegExp(`\\b${klass}\\b`, 'g'), "")

  return element
})

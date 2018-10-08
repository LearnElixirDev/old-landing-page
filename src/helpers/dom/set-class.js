import {curry} from 'ramda'

export const setClass = curry((klass, element) => {
  element.className += element.className ? ` ${klass}` : klass

  return element
})

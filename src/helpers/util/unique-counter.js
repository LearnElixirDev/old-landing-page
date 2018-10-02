import {identity} from 'ramda'

export const uniqueCounter = (transform = identity) => {
  let currentCounter = 0

  return () => transform ? transform(currentCounter++) : currentCounter++
}

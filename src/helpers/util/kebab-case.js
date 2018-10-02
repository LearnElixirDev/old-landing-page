import words from 'lodash.words'
import {pipe, toLower, join, unary} from 'ramda'

export const kebabCase = pipe(unary(words), join('-'), toLower)

import {converge, toString, compose, concat} from 'ramda'

import {uniqueCounter} from 'helpers/util'

import {labelToFieldName} from './label-to-field-name'

const addSeperator = compose(concat('-'), toString)
const generateNextId = uniqueCounter(addSeperator)

export const labelToFieldId = converge(concat, [
  labelToFieldName,
  generateNextId
])


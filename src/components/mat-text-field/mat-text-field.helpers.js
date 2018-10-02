import {converge, toString, compose, identity, concat} from 'ramda'

import {kebabCase, uniqueCounter} from 'helpers/util'

const DEFAULT_CLASSES = 'mdc-text-field'
const OUTLINE_CLASS = 'mdc-text-field--outlined'
const FULL_WIDTH_CLASS = 'mdc-text-field--fullwidth'

export const labelToFieldName = kebabCase

const addSeperator = compose(concat('-'), toString)
const generateNextId = uniqueCounter(addSeperator)

export const labelToFieldId = converge(concat, [kebabCase, generateNextId])

export const createContainerClass = (classAdditions, isFullWidth, shouldRemoveOutline) => {
  let classList = DEFAULT_CLASSES

  if (isFullWidth)
    classList += ` ${FULL_WIDTH_CLASS}`

  if (!shouldRemoveOutline)
    classList += ` ${OUTLINE_CLASS}`

  return `${classList} ${classAdditions || ''}`
}


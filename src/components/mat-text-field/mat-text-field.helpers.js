const DEFAULT_CLASSES = 'mdc-text-field'
const OUTLINE_CLASS = 'mdc-text-field--outlined'
const FULL_WIDTH_CLASS = 'mdc-text-field--fullwidth'

export const createContainerClass = (classAdditions, isFullWidth, shouldRemoveOutline) => {
  let classList = DEFAULT_CLASSES

  if (isFullWidth)
    classList += ` ${FULL_WIDTH_CLASS}`

  if (!shouldRemoveOutline)
    classList += ` ${OUTLINE_CLASS}`

  return `${classList} ${classAdditions || ''}`
}

export const createInputField = (fieldId, type, fieldName, autocomplete, pattern, required, tabIndex) => {
  return `
    <input class='mdc-text-field__input'
           id='{fieldId}'
           type='type'
           name='{fieldName}'
           ${autocomplete ? `autocomplete='${autocomplete}'` : ''}
           ${pattern ? `pattern='${pattern}'` : ''}
           ${required ? `required='${required}'` : ''}
           ${tabIndex ? `tabIndex='${tabIndex}'` : ''}
    >
  `
}

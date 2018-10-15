export const createElementFromString = (eleString) => {
  const div = document.createElement('div')

  div.innerHTML = eleString.trim()

  // Change this to div.childNodes to support multiple top-level nodes
  return div.childNodes
}

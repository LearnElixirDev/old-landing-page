export const svgToDom = (svgString) => {
  const div = document.createElement('div')

  div.innerHTML = svgString

  return div.firstChild
}

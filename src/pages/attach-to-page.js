import Page from './page.component.pug'

export const attachToPage = (component) => new Page({
  target: document.body,
  data: {component}
})

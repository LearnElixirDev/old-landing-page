import {attachToPage} from './attach-to-page'
import {setupPage} from './setup-page'
import Process from './process/process.component.pug'

setupPage()
attachToPage(Process)

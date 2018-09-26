import {attachToPage} from './attach-to-page'
import {setupPage} from './setup-page'
import Home from './home/home.component.pug'

setupPage()
attachToPage(Home)

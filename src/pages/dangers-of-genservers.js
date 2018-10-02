import {setupPage} from './setup-page'

import {attachToPage} from './attach-to-page'
import DangersOfGenServers from './blog-views/dangers-of-genservers.component.pug'

setupPage()
attachToPage(DangersOfGenServers)

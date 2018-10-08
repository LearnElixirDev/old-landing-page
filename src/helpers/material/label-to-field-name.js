import {toLower, compose} from 'ramda'

import {kebabCase} from 'helpers/util'

export const labelToFieldName = compose(toLower, kebabCase)

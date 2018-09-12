import {create, env} from '../node_modules/sanctuary'

const checkTypes = process.env.NODE_ENV !== 'production'
const S = create({checkTypes, env})

export default S

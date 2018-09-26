import {flip, replace} from 'ramda'

export const replaceGivenWith = (replaceStr) => flip(replace(replaceStr))

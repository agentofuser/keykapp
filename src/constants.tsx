import { range } from 'fp-ts/es6/Array'
import { Keyswitch, LeftHand, RightHand } from './types'

export const homerowKeyswitches: Keyswitch[] = [
  // { index: 0, key: 'a', actuationCost: 4, hand: LeftHand },
  { index: 1, key: 's', actuationCost: 3, hand: LeftHand },
  { index: 2, key: 'd', actuationCost: 2, hand: LeftHand },
  { index: 3, key: 'f', actuationCost: 1, hand: LeftHand },
  { index: 4, key: 'j', actuationCost: 1, hand: RightHand },
  { index: 5, key: 'k', actuationCost: 2, hand: RightHand },
  { index: 6, key: 'l', actuationCost: 3, hand: RightHand },
  // { index: 7, key: ';', actuationCost: 4, hand: RightHand },
]

export const spacebarKeyswitch: Keyswitch = {
  index: 8,
  key: ' ',
  actuationCost: 1,
}

export const escapeKeyswitch: Keyswitch = {
  index: 9,
  key: 'Escape',
  actuationCost: 4,
}

export const idv0UserlandPrefix = '/userland/kapp/'
export const asciiIdv0Path = `${idv0UserlandPrefix}literals/ascii/`

export const idv0SystemPrefix = '/system/kapp/'

export const undoIdv0 = `${idv0SystemPrefix}syncRoot/undo`
export const redoIdv0 = `${idv0SystemPrefix}syncRoot/redo`

export const modeInsertIdv0 = `${idv0SystemPrefix}inputMode/insert`
export const modeMenuIdv0 = `${idv0SystemPrefix}inputMode/menu`

export const manualWeights: { [name: string]: number } = {}
manualWeights[`${idv0UserlandPrefix}text/copy`] = 40
// manualWeights[undoIdv0] = 150
// manualWeights[redoIdv0] = 150

manualWeights[modeInsertIdv0] = 30000
manualWeights[modeMenuIdv0] = 30000

const zoom = (name: string): void => {
  manualWeights[`${idv0UserlandPrefix}zoom/${name}`] = 10000
}
zoom('in')
zoom('out')

const focus = (name: string): void => {
  manualWeights[`${idv0UserlandPrefix}focus/${name}`] = 10000
}
focus('next')
focus('prev')
// focus('first')
// focus('last')
const sexp = (name: string, weight = 20000): void => {
  manualWeights[`${idv0UserlandPrefix}sexp/${name}`] = weight
}
sexp('delete')
// sexp('move-back')
// sexp('move-forth')

const nameWeight = (name: string, weight = 20000): void => {
  manualWeights[`${idv0UserlandPrefix}${name}`] = weight
}

nameWeight('char/upcase', 20000)
nameWeight('list/new', 40000)
nameWeight('text/new', 40000)

export const nGramRange = range(1, 1)

export const gitRepoDir = '/keykapp/syncRootLog/'

export const maxPasteLength = 280

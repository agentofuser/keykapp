import { Keyswitch, LeftHand, RightHand } from './types'

export const allKeyswitches: Keyswitch[] = [
  // { index: 0, key: 'a', actuationCost: 4, hand: LeftHand },
  // { index: 1, key: 's', actuationCost: 3, hand: LeftHand },
  { index: 2, key: 'd', actuationCost: 2, hand: LeftHand },
  { index: 3, key: 'f', actuationCost: 1, hand: LeftHand },
  { index: 4, key: 'j', actuationCost: 1, hand: RightHand },
  { index: 5, key: 'k', actuationCost: 2, hand: RightHand },
  // { index: 6, key: 'l', actuationCost: 3, hand: RightHand },
  // { index: 7, key: ';', actuationCost: 4, hand: RightHand },
]

export const idv0UserlandPrefix = '/userland/kapp/'
export const asciiIdv0Path = `${idv0UserlandPrefix}literals/ascii/`

export const idv0SystemPrefix = '/system/kapp/'

export const manualWeights: { [name: string]: number } = {}
manualWeights[`${idv0UserlandPrefix}char/delete`] = 80
manualWeights[`${idv0UserlandPrefix}text/copy`] = 40

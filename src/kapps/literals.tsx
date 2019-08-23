import { map } from 'fp-ts/es6/Array'
import { asciiIdv0Path } from '../constants'
import { currentSexpAtom } from '../state'
import {
  AppAction,
  AppSyncRoot,
  DraftSyncRootMutator,
  UserlandKapp,
} from '../types'

const pushLiteral = (literal: string): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  const text = currentSexpAtom(draftState)
  if (text && text.insertAt) {
    text.insertAt(text.length, literal)
  }
}

// This list doesn't include tab and newline. These are the character codes
// from 32 to 126.
const ascii32To126 =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@[\\]^_`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{|}~'

export const printableAsciiChars: UserlandKapp[] = map(
  (char: string): UserlandKapp => ({
    type: 'UserlandKapp',
    idv0: `${asciiIdv0Path}${char.charCodeAt(0)}`,
    shortAsciiName: char === ' ' ? ':space' : char,
    legend: char === ' ' ? 'space' : char,
    instruction: pushLiteral(char),
  })
)(ascii32To126.split(''))

export const newlineChar: UserlandKapp = {
  type: 'UserlandKapp',
  idv0: `${asciiIdv0Path}${'\n'.charCodeAt(0)}`,
  shortAsciiName: ':newline',
  legend: 'newline',
  instruction: pushLiteral('\n'),
}

import { map } from 'fp-ts/es6/Array'
import { asciiIdv0Path } from '../constants'
import {
  getCurrentFocusCursorIdx,
  setFocusCursorIdx,
  zoomedText,
} from '../state'
import {
  AppAction,
  AppState,
  AppSyncRoot,
  DraftSyncRootMutator,
  UserlandKapp,
} from '../types'

const pushLiteral = (literal: string): DraftSyncRootMutator => (
  draftSyncRoot: AppSyncRoot,
  _action: AppAction
): void => {
  const text = zoomedText(draftSyncRoot)

  if (!text) return

  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)

  const valueAsArray = text.value.split('')
  valueAsArray.splice(focusCursorIdx, 0, literal)
  text.value = valueAsArray.join('')

  setFocusCursorIdx(draftSyncRoot, text, focusCursorIdx + 1)
}

// This list doesn't include tab and newline. These are the character codes
// from 32 to 126 minus uppercase letters.
export const ascii32To126 =
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

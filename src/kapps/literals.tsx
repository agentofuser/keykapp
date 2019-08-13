import { map } from 'fp-ts/es6/Array'
import { asciiIdv0Path } from '../constants'
import { AppAction, AppSyncRoot, DraftSyncRootMutator, Kapp } from '../types'

const pushLiteral = (literal: string): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  draftState.currentBuffer = draftState.currentBuffer + literal
}

// This list doesn't include tab and newline. These are the character codes
// from 32 to 126.
const ascii32To126 =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'

export const printableAsciiChars: Kapp[] = map(
  (char: string): Kapp => ({
    idv0: `${asciiIdv0Path}${char.charCodeAt(0)}`,
    shortAsciiName: char === ' ' ? ':space' : char,
    legend: char === ' ' ? 'space' : char,
    instruction: pushLiteral(char),
  })
)(ascii32To126.split(''))

export const newlineChar: Kapp = {
  idv0: `${asciiIdv0Path}${'\n'.charCodeAt(0)}`,
  shortAsciiName: ':newline',
  legend: 'newline',
  instruction: pushLiteral('\n'),
}
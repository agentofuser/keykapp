import * as React from 'react'
import { map } from 'fp-ts/es6/Array'
import { AppReducer, AppState, AppAction, Command } from '../types'
import { Paper } from '@material-ui/core'

const pushLiteral = (literal: string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = prevState
  nextState.currentBuffer = prevState.currentBuffer + literal
  return nextState
}

// This list doesn't include tab and newline. These are the character codes
// from 32 to 126.
const ascii32To126 =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'

export const printableAsciiChars: Command[] = map(
  (char: string): Command => ({
    legend: (
      <Paper>
        <kbd>{char === ' ' ? 'space' : char}</kbd>
      </Paper>
    ),
    instruction: pushLiteral(char),
  })
)(ascii32To126.split(''))

export const newlineChar: Command = {
  legend: 'write newline',
  instruction: pushLiteral('\n'),
}

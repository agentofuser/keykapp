import { Paper, Typography } from '@material-ui/core'
import { map } from 'fp-ts/es6/Array'
import * as React from 'react'
import { AppAction, AppReducer, AppState, Command } from '../types'

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

const idv0Prefix = '/keykapp/commands/literals/ascii/'

export const printableAsciiChars: Command[] = map(
  (char: string): Command => ({
    idv0: `${idv0Prefix}${char.charCodeAt}`,
    legend: (
      <Paper
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5" align="center">
          <kbd>{char === ' ' ? 'space' : char}</kbd>
        </Typography>
      </Paper>
    ),
    instruction: pushLiteral(char),
  })
)(ascii32To126.split(''))

export const newlineChar: Command = {
  idv0: `${idv0Prefix}${'\n'.charCodeAt}`,
  legend: 'write newline',
  instruction: pushLiteral('\n'),
}

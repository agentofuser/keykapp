import { Paper, Typography } from '@material-ui/core'
import { map } from 'fp-ts/es6/Array'
import * as React from 'react'
import { AppAction, AppReducer, AppState, Kapp } from '../types'

const pushLiteral = (literal: string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer + literal,
  }
  return nextState
}

// This list doesn't include tab and newline. These are the character codes
// from 32 to 126.
const ascii32To126 =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'

const idv0Prefix = '/keykapp/kapps/literals/ascii/'

export interface LiteralLegendProps {
  title: string
}

export function LiteralLegend({
  title,
}: LiteralLegendProps): React.ReactElement {
  return (
    <Paper
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h5" align="center">
        <kbd>{title === ' ' ? ':space' : title}</kbd>
      </Typography>
    </Paper>
  )
}

export const printableAsciiChars: Kapp[] = map(
  (char: string): Kapp => ({
    idv0: `${idv0Prefix}${char.charCodeAt(0)}`,
    shortAsciiName: char,
    legend: <LiteralLegend title={char} />,
    instruction: pushLiteral(char),
    actuationCount: 1,
  })
)(ascii32To126.split(''))

export const newlineChar: Kapp = {
  idv0: `${idv0Prefix}${'\n'.charCodeAt}`,
  shortAsciiName: ':newline',
  legend: 'newline',
  instruction: pushLiteral('\n'),
  actuationCount: 1,
}

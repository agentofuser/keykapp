import { Paper, Typography } from '@material-ui/core'
import { map } from 'fp-ts/es6/Array'
import * as React from 'react'
import { charCounts } from '../datasets/tweet'
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '100%',
      }}
    >
      <Paper>
        <Typography align="center">
          <kbd style={{ padding: '1rem' }}>{title}</kbd>
        </Typography>
      </Paper>
    </div>
  )
}

export const printableAsciiChars: Kapp[] = map(
  (char: string): Kapp => ({
    idv0: `${idv0Prefix}${char.charCodeAt(0)}`,
    shortAsciiName: char === ' ' ? ':space' : char,
    legend: <LiteralLegend title={char === ' ' ? ':space' : char} />,
    instruction: pushLiteral(char),
    actuationCount: charCounts[char] || 0,
  })
)(ascii32To126.split(''))

export const newlineChar: Kapp = {
  idv0: `${idv0Prefix}${'\n'.charCodeAt}`,
  shortAsciiName: ':newline',
  legend: <LiteralLegend title={'newline'} />,
  instruction: pushLiteral('\n'),
  actuationCount: charCounts['\n'] || 0,
}

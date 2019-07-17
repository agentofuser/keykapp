import { AppReducer, AppState, AppAction } from '../types'

const pushLiteral = (literal: string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = prevState
  nextState.currentBuffer = prevState.currentBuffer + literal
  return nextState
}

export const literals = [
  {
    legend: 'write newline',
    instruction: pushLiteral('\n'),
  },
  {
    legend: 'write space',
    instruction: pushLiteral(' '),
  },
  {
    legend: "write '🧢'",
    instruction: pushLiteral('🧢'),
  },
  {
    legend: "write 'o'",
    instruction: pushLiteral('o'),
  },
  {
    legend: "write 'k'",
    instruction: pushLiteral('k'),
  },
]

import { AppReducer, Command, AppState, AppAction } from '../types'
import { newlineChar, printableAsciiChars } from './literals'

const mapLastWord = (mapWord: (word: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = prevState
  nextState.currentBuffer = prevState.currentBuffer.replace(
    /\w+$/,
    (lastWord: string): string => mapWord(lastWord)
  )
  return nextState
}

const deleteChunkBackwards: AppReducer = (prevState, _action): AppState => {
  const nextState = prevState
  nextState.currentBuffer = prevState.currentBuffer.replace(/\s*\S+\s*$/, '')
  return nextState
}

const idv0Prefix = '/keykapp/commands/word/'

export const allCommands: Command[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0Prefix}upcase`,
    legend: 'upcase word',
    instruction: mapLastWord((word: string): string => word.toUpperCase()),
  },
  {
    idv0: `${idv0Prefix}downcase`,
    legend: 'downcase word',
    instruction: mapLastWord((word: string): string => word.toLowerCase()),
  },
  {
    idv0: `${idv0Prefix}delete`,
    legend: 'delete word',
    instruction: deleteChunkBackwards,
  },
]

import { AppReducer, Kapp, AppState, AppAction } from '../types'
import { newlineChar, printableAsciiChars } from './literals'

const mapLastWord = (mapWord: (word: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer.replace(
      /\w+$/,
      (lastWord: string): string => mapWord(lastWord)
    ),
  }
  return nextState
}

const deleteChunkBackwards: AppReducer = (prevState, _action): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer.replace(/\s*\S+\s*$/, ''),
  }
  return nextState
}

const idv0Prefix = '/keykapp/kapps/word/'

export const allKapps: Kapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0Prefix}upcase`,
    shortAsciiName: ':upcase',
    legend: 'upcase word',
    instruction: mapLastWord((word: string): string => word.toUpperCase()),
    actuationCount: 0,
  },
  {
    idv0: `${idv0Prefix}downcase`,
    shortAsciiName: ':downcase',
    legend: 'downcase word',
    instruction: mapLastWord((word: string): string => word.toLowerCase()),
    actuationCount: 0,
  },
  {
    idv0: `${idv0Prefix}delete`,
    shortAsciiName: ':delete',
    legend: 'delete word',
    instruction: deleteChunkBackwards,
    actuationCount: 0,
  },
]

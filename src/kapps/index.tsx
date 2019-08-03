import * as copy from 'copy-text-to-clipboard'
import { map } from 'fp-ts/es6/Array'
import { idv0SystemPrefix, idv0UserlandPrefix } from '../constants'
import { zoomOutToParent, zoomOutToRoot } from '../navigation'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import { AppAction, AppReducer, AppState, Kapp, Waypoint } from '../types'
import { newlineChar, printableAsciiChars } from './literals'

const mapLastWord = (wordMapper: (word: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer.replace(
      /\w+$/,
      (lastWord: string): string => wordMapper(lastWord)
    ),
  }
  return nextState
}

const mapLastChar = (charMapper: (char: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer.replace(
      /.$/,
      (lastChar: string): string => charMapper(lastChar)
    ),
  }
  return nextState
}

const mapBuffer = (bufferMapper: (buffer: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: bufferMapper(prevState.currentBuffer),
  }
  return nextState
}

const deleteChunkBackwards: AppReducer = (prevState, _action): AppState => {
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer.replace(/(\s*\S+|\s+)$/, ''),
  }
  return nextState
}

// TODO this should be an async task or something to handle effects
const copyCurrentBufferToClipboard: AppReducer = (
  prevState,
  _action
): AppState => {
  const copied = copy(prevState.currentBuffer)
  const statusMsg = copied ? '[!copied]' : "[!couldn't copy]"
  const nextState = {
    ...prevState,
    currentBuffer: prevState.currentBuffer + ` ${statusMsg}`,
  }
  return nextState
}

export const userlandKapps: Kapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0UserlandPrefix}word/upcase`,
    shortAsciiName: ':upcase',
    legend: 'upcase word',
    instruction: mapLastWord((word: string): string => word.toUpperCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}word/downcase`,
    shortAsciiName: ':downcase',
    legend: 'downcase word',
    instruction: mapLastWord((word: string): string => word.toLowerCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}text/delete-wordish-backwards`,
    shortAsciiName: ':delWord',
    legend: 'delete word',
    instruction: deleteChunkBackwards,
  },
  {
    idv0: `${idv0UserlandPrefix}text/delete-char-backwards`,
    shortAsciiName: ':delChar',
    legend: 'delete character',
    instruction: mapLastChar((_char: string): string => ''),
  },
  {
    idv0: `${idv0UserlandPrefix}text/clear-buffer`,
    shortAsciiName: ':clear',
    legend: 'clear buffer',
    instruction: mapBuffer((_buffer: string): string => ''),
  },
  {
    idv0: `${idv0UserlandPrefix}text/copy-to-clipboard`,
    shortAsciiName: ':copy',
    legend: 'copy text to clipboard',
    instruction: copyCurrentBufferToClipboard,
  },
]

const navUpKapp: Kapp = {
  idv0: `${idv0SystemPrefix}navigation/up`,
  shortAsciiName: ':navUp',
  legend: '⬅️ back',
  instruction: zoomOutToParent,
}

const navRootKapp: Kapp = {
  idv0: `${idv0SystemPrefix}navigation/root`,
  shortAsciiName: ':navRoot',
  legend: '🏡 home',
  instruction: zoomOutToRoot,
}

export const systemKapps: Kapp[] = [navUpKapp, navRootKapp]

export const allKapps: Kapp[] = systemKapps.concat(userlandKapps)

export const KappStore: Map<string, Kapp> = new Map(
  map((kapp: Kapp): [string, Kapp] => [kapp.idv0, kapp])(allKapps)
)

export function getKappById(id: string): Kapp {
  const kapp = KappStore.get(id)
  if (kapp) {
    return kapp
  } else {
    throw new Error('Could not find kapp by id.')
  }
}

export const navUpWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint([], navUpKapp)

export const navRootWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint([], navRootKapp)

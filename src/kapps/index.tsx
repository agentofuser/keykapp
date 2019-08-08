import * as copy from 'copy-text-to-clipboard'
import { map } from 'fp-ts/es6/Array'
import * as Automerge from 'automerge'
import { idv0SystemPrefix, idv0UserlandPrefix } from '../constants'
import { zoomOutToParent, zoomOutToRoot } from '../navigation'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import {
  AppAction,
  AppReducer,
  AppState,
  Kapp,
  Waypoint,
  SyncRoot,
} from '../types'
import { newlineChar, printableAsciiChars } from './literals'

const mapLastWord = (wordMapper: (word: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.currentBuffer = prevState.currentBuffer.replace(
      /\w+$/,
      (lastWord: string): string => wordMapper(lastWord)
    )
  })
  return nextState
}

const mapLastChar = (charMapper: (char: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.currentBuffer = prevState.currentBuffer.replace(
      /[\s\S]$/,
      (lastChar: string): string => charMapper(lastChar)
    )
  })
  return nextState
}

const mapBuffer = (bufferMapper: (buffer: string) => string): AppReducer => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.currentBuffer = bufferMapper(prevState.currentBuffer)
  })
  return nextState
}

const deleteChunkBackwards: AppReducer = (prevState, _action): AppState => {
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.currentBuffer = prevState.currentBuffer.replace(/(\s*\S+|\s+)$/, '')
  })
  return nextState
}

// TODO this should be an async task or something to handle effects
const copyCurrentBufferToClipboard: AppReducer = (
  prevState,
  _action
): AppState => {
  const copied = copy(prevState.currentBuffer)
  const statusMsg = copied ? '[!copied]' : "[!couldn't copy]"
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.currentBuffer = prevState.currentBuffer + ` ${statusMsg}`
  })
  return nextState
}

export const userlandKapps: Kapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0UserlandPrefix}word/upcase`,
    shortAsciiName: ':word-upcase',
    legend: 'upcase word',
    instruction: mapLastWord((word: string): string => word.toUpperCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}word/downcase`,
    shortAsciiName: ':word-downcase',
    legend: 'downcase word',
    instruction: mapLastWord((word: string): string => word.toLowerCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}wordish/delete`,
    shortAsciiName: ':wordish-delete',
    legend: 'delete to prev word',
    instruction: deleteChunkBackwards,
  },
  {
    idv0: `${idv0UserlandPrefix}char/delete`,
    shortAsciiName: ':char-delete',
    legend: 'delete character',
    instruction: mapLastChar((_char: string): string => ''),
  },
  {
    idv0: `${idv0UserlandPrefix}text/delete-all`,
    shortAsciiName: ':text-delete-all',
    legend: 'delete all text',
    instruction: mapBuffer((_buffer: string): string => ''),
  },
  {
    idv0: `${idv0UserlandPrefix}text/copy`,
    shortAsciiName: ':text-copy',
    legend: 'copy text to clipboard',
    instruction: copyCurrentBufferToClipboard,
  },
]

const navUpKapp: Kapp = {
  idv0: `${idv0SystemPrefix}menu/up`,
  shortAsciiName: ':menu-up',
  legend: '⬅️ :menu-up',
  instruction: zoomOutToParent,
}

const navRootKapp: Kapp = {
  idv0: `${idv0SystemPrefix}menu/home`,
  shortAsciiName: ':menu-home',
  legend: '🏡 :menu-home',
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

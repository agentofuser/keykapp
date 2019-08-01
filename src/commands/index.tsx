import { zoomOutToParent, zoomOutToRoot } from '../navigation'
import { AppAction, AppReducer, AppState, Kapp, Waypoint } from '../types'
import { newlineChar, printableAsciiChars, LiteralLegend } from './literals'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import * as React from 'react'
import * as copy from 'copy-text-to-clipboard'

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

const idv0Prefix = '/keykapp/kapps/'

export const userlandKapps: Kapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0Prefix}word/upcase`,
    shortAsciiName: ':upcase',
    legend: 'upcase word',
    instruction: mapLastWord((word: string): string => word.toUpperCase()),
    actuationCount: 0,
  },
  {
    idv0: `${idv0Prefix}word/downcase`,
    shortAsciiName: ':downcase',
    legend: 'downcase word',
    instruction: mapLastWord((word: string): string => word.toLowerCase()),
    actuationCount: 0,
  },
  {
    idv0: `${idv0Prefix}text/delete`,
    shortAsciiName: ':delete',
    legend: 'delete word',
    instruction: deleteChunkBackwards,
    actuationCount: 10000,
  },
  {
    idv0: `${idv0Prefix}text/copy-to-clipboard`,
    shortAsciiName: ':copy',
    legend: 'copy text to clipboard',
    instruction: copyCurrentBufferToClipboard,
    actuationCount: 10000,
  },
]

const navUpKapp: Kapp = {
  idv0: '/keykapp/kapps/navigation/up',
  shortAsciiName: ':navUp',
  legend: <LiteralLegend title={'⬅️ back'} />,
  instruction: zoomOutToParent,
  actuationCount: 0,
}

export const navUpWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint(navUpKapp)

const navRootKapp: Kapp = {
  idv0: '/keykapp/kapps/navigation/root',
  shortAsciiName: ':navRoot',
  legend: <LiteralLegend title={'🏡 home'} />,
  instruction: zoomOutToRoot,
  actuationCount: 0,
}

export const navRootWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint(navRootKapp)

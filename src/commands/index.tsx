import { zoomOutToParent, zoomOutToRoot } from '../navigation'
import { AppAction, AppReducer, AppState, Kapp, Waypoint } from '../types'
import { newlineChar, printableAsciiChars, LiteralLegend } from './literals'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import * as React from 'react'

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
    actuationCount: 10000,
  },
]

const navUpKapp: Kapp = {
  idv0: '/keykapp/kapps/navigation/up',
  shortAsciiName: ':navUp',
  legend: <LiteralLegend title={'⬅️back'} />,
  instruction: zoomOutToParent,
  actuationCount: 0,
}

export const navUpWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint(navUpKapp)

const navRootKapp: Kapp = {
  idv0: '/keykapp/kapps/navigation/root',
  shortAsciiName: ':navRoot',
  legend: <LiteralLegend title={'🏡home'} />,
  instruction: zoomOutToRoot,
  actuationCount: 0,
}

export const navRootWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint(navRootKapp)

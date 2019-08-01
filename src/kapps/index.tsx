import { zoomOutToParent, zoomOutToRoot } from '../navigation'
import { AppAction, AppReducer, AppState, Kapp, Waypoint } from '../types'
import { newlineChar, printableAsciiChars, LiteralLegend } from './literals'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import * as React from 'react'
import * as copy from 'copy-text-to-clipboard'
import { idv0Prefix } from '../constants'

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
    idv0: `${idv0Prefix}word/upcase`,
    shortAsciiName: ':upcase',
    legend: 'upcase word',
    instruction: mapLastWord((word: string): string => word.toUpperCase()),
  },
  {
    idv0: `${idv0Prefix}word/downcase`,
    shortAsciiName: ':downcase',
    legend: 'downcase word',
    instruction: mapLastWord((word: string): string => word.toLowerCase()),
  },
  {
    idv0: `${idv0Prefix}text/delete-wordish-backwards`,
    shortAsciiName: ':delWord',
    legend: 'delete word',
    instruction: deleteChunkBackwards,
  },
  {
    idv0: `${idv0Prefix}text/delete-char-backwards`,
    shortAsciiName: ':delChar',
    legend: 'delete character',
    instruction: mapLastChar((_char: string): string => ''),
  },
  {
    idv0: `${idv0Prefix}text/clear-buffer`,
    shortAsciiName: ':clear',
    legend: 'clear buffer',
    instruction: mapBuffer((_buffer: string): string => ''),
  },
  {
    idv0: `${idv0Prefix}text/copy-to-clipboard`,
    shortAsciiName: ':copy',
    legend: 'copy text to clipboard',
    instruction: copyCurrentBufferToClipboard,
  },
]

const navUpKapp: Kapp = {
  idv0: `${idv0Prefix}navigation/up`,
  shortAsciiName: ':navUp',
  legend: <LiteralLegend title={'⬅️ back'} />,
  instruction: zoomOutToParent,
}

export const navUpWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint([], navUpKapp)

const navRootKapp: Kapp = {
  idv0: `${idv0Prefix}navigation/root`,
  shortAsciiName: ':navRoot',
  legend: <LiteralLegend title={'🏡 home'} />,
  instruction: zoomOutToRoot,
}

export const navRootWaypointBuilder = (): Waypoint =>
  makeOrphanLeafWaypoint([], navRootKapp)

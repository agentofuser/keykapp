import * as copy from 'copy-text-to-clipboard'
import { map } from 'fp-ts/es6/Array'
import { idv0UserlandPrefix } from '../constants'
import { AppAction, AppSyncRoot, DraftSyncRootMutator, Kapp } from '../types'
import { newlineChar, printableAsciiChars } from './literals'

const mapLastChar = (
  charMapper: (char: string) => string
): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  draftState.currentBuffer = draftState.currentBuffer.replace(
    /[\s\S]$/,
    (lastChar: string): string => charMapper(lastChar)
  )
}

const mapBuffer = (
  bufferMapper: (buffer: string) => string
): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  draftState.currentBuffer = bufferMapper(draftState.currentBuffer)
}

const deleteChunkBackwards: DraftSyncRootMutator = (
  draftState,
  _action
): void => {
  draftState.currentBuffer = draftState.currentBuffer.replace(
    /(\s*\S+|\s+)$/,
    ''
  )
}

// TODO this should be an async task or something to handle effects
const copyCurrentBufferToClipboard: DraftSyncRootMutator = (
  draftState,
  _action
): void => {
  const copied = copy(draftState.currentBuffer)
  const statusMsg = copied ? '[!copied]' : "[!couldn't copy]"
  draftState.currentBuffer = draftState.currentBuffer + ` ${statusMsg}`
}

export const userlandKapps: Kapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0UserlandPrefix}wordish/delete`,
    shortAsciiName: ':wordish-delete',
    legend: 'delete to prev word',
    instruction: deleteChunkBackwards,
  },
  {
    idv0: `${idv0UserlandPrefix}char/upcase`,
    shortAsciiName: ':char-upcase',
    legend: 'upcase char',
    instruction: mapLastChar((char: string): string => char.toUpperCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}char/downcase`,
    shortAsciiName: ':char-downcase',
    legend: 'downcase char',
    instruction: mapLastChar((char: string): string => char.toLowerCase()),
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

export const allKapps: Kapp[] = userlandKapps

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

export function findKappById(id: string): Kapp | null {
  const kapp = KappStore.get(id)
  return kapp || null
}

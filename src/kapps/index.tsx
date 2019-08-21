import * as copy from 'copy-text-to-clipboard'
import { filter, map } from 'fp-ts/es6/Array'
import murmurhash from '../kitchensink/murmurhash'
import { idv0UserlandPrefix } from '../constants'
import { AppAction, AppSyncRoot, DraftSyncRootMutator, Kapp } from '../types'
import { newlineChar, printableAsciiChars } from './literals'
import { currentSexpAtom, currentSexpList } from '../state'
import * as Automerge from 'automerge'

const mapLastChar = (
  charMapper: (char: string) => string
): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  const text = currentSexpAtom(draftState)
  if (text && text.length > 0) {
    const lastIdx = text.length - 1
    const lastChar = text.get(lastIdx)

    if (text.deleteAt) text.deleteAt(lastIdx)
    const replacementChar = charMapper(lastChar)
    if (text.insertAt && replacementChar)
      text.insertAt(lastIdx, replacementChar)
  }
}

const mapBuffer = (
  bufferMapper: (buffer: string) => string
): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  const list = currentSexpList(draftState)
  const atom = currentSexpAtom(draftState)
  const idx = draftState.currentSexpAtomIndx
  if (atom && idx !== null) {
    list[idx] = new Automerge.Text(bufferMapper(atom.join('')))
  }
}

// TODO this should be an async task or something to handle effects
const copyCurrentSexpAtomToClipboard: DraftSyncRootMutator = (
  draftState,
  _action
): void => {
  let copied = false
  const atom = currentSexpAtom(draftState)
  if (atom) copied = copy(atom.join(''))
  if (!copied) {
    console.error('Could not copy to clipboard.')
  }
}

export const userlandKapps: Kapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    idv0: `${idv0UserlandPrefix}char/upcase`,
    shortAsciiName: ':upcase',
    legend: 'upcase char',
    instruction: mapLastChar((char: string): string => char.toUpperCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}char/downcase`,
    shortAsciiName: ':downcase',
    legend: 'downcase char',
    instruction: mapLastChar((char: string): string => char.toLowerCase()),
  },
  {
    idv0: `${idv0UserlandPrefix}char/delete`,
    shortAsciiName: ':delete',
    legend: 'delete character',
    instruction: mapLastChar((_char: string): string => ''),
  },
  {
    idv0: `${idv0UserlandPrefix}text/delete-all`,
    shortAsciiName: ':delete-all',
    legend: 'delete all text',
    instruction: mapBuffer((_buffer: string): string => ''),
  },
  {
    idv0: `${idv0UserlandPrefix}text/copy`,
    shortAsciiName: ':copy-all',
    legend: 'copy text to clipboard',
    instruction: copyCurrentSexpAtomToClipboard,
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

export function selectKappsFromIds(ids: string[]): Kapp[] {
  return filter(Boolean)(map(findKappById)(ids))
}

export function showKappsFromIds(ids: string[]): string {
  return map((kapp: Kapp): string => kapp.shortAsciiName)(
    selectKappsFromIds(ids)
  ).join('')
}

// from https://stackoverflow.com/a/21682946/11343832
function intToHSL(int: number): string {
  var shortened = int % 360
  return 'hsl(' + shortened + ',90%,90%)'
}

export function kappColor(kapp: Kapp): string {
  return intToHSL(murmurhash(kapp.idv0, 42))
}

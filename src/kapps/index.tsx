import * as Automerge from 'automerge'
import * as copy from 'copy-text-to-clipboard'
import { filter, map } from 'fp-ts/es6/Array'
import {
  idv0SystemPrefix,
  idv0UserlandPrefix,
  redoIdv0,
  undoIdv0,
} from '../constants'
import murmurhash from '../kitchensink/murmurhash'
import { zoomOutToParent, zoomOutToRoot } from '../navigation'
import { currentSexpAtom, currentSexpList } from '../state'
import {
  AppAction,
  AppState,
  AppSyncRoot,
  DraftSyncRootMutator,
  Kapp,
  SystemKapp,
  UserlandKapp,
} from '../types'
import { newlineChar, printableAsciiChars } from './literals'

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

export const userlandKapps: UserlandKapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/upcase`,
    shortAsciiName: ':upcase',
    legend: ':upcase',
    instruction: mapLastChar((char: string): string => char.toUpperCase()),
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/downcase`,
    shortAsciiName: ':downcase',
    legend: ':downcase',
    instruction: mapLastChar((char: string): string => char.toLowerCase()),
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/delete`,
    shortAsciiName: ':backspace',
    legend: ':backspace',
    instruction: mapLastChar((_char: string): string => ''),
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}text/clear`,
    shortAsciiName: ':clear',
    legend: '∅:clear',
    instruction: mapBuffer((_buffer: string): string => ''),
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}text/copy`,
    shortAsciiName: ':copy',
    legend: '📋:copy',
    instruction: copyCurrentSexpAtomToClipboard,
  },
]

export const menuUpKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: `${idv0SystemPrefix}menu/up`,
  shortAsciiName: ':menu-up',
  legend: '🔼:menu-up',
  instruction: zoomOutToParent,
}

function undoInstruction(draftState: AppState, _action: AppAction): void {
  const syncRoot = draftState.syncRoot
  if (!syncRoot) return

  if (Automerge.canUndo(syncRoot)) {
    draftState.syncRoot = Automerge.undo(syncRoot, undoIdv0)
  }
  zoomOutToRoot(draftState, _action)
}

function redoInstruction(draftState: AppState, _action: AppAction): void {
  const syncRoot = draftState.syncRoot
  if (!syncRoot) return

  if (Automerge.canRedo(syncRoot)) {
    draftState.syncRoot = Automerge.redo(syncRoot, redoIdv0)
  }
  zoomOutToRoot(draftState, _action)
}

export const undoKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: undoIdv0,
  shortAsciiName: ':undo',
  legend: '↩️:undo',
  instruction: undoInstruction,
}

export const redoKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: redoIdv0,
  shortAsciiName: ':redo',
  legend: '↪️:redo',
  instruction: redoInstruction,
}

export const systemKapps: SystemKapp[] = [menuUpKapp, undoKapp, redoKapp]

export const allKapps: Kapp[] = [...userlandKapps, ...systemKapps]

export const huffmanKapps: Kapp[] = [...userlandKapps, undoKapp, redoKapp]

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
function intToHSL(int: number, saturation = 100, lighting = 80): string {
  var shortened = int % 360
  return 'hsl(' + shortened + `,${saturation}%,${lighting}%)`
}

export function kappColor(kapp: Kapp, saturation = 90, lighting = 87): string {
  return intToHSL(murmurhash(kapp.idv0, 42), saturation, lighting)
}

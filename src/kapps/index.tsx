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
import { menuOut, menuOutToRoot } from '../navigation'
import {
  lastListInZoomPath,
  zoomedText,
  getCurrentFocusCursorIdx,
} from '../state'
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
import { sexpKapps } from './Sexp'

const mapFocusedChar = (
  charMapper: (char: string) => string
): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  const text = zoomedText(draftState)
  if (!text) return
  const focusedCursorIdx = getCurrentFocusCursorIdx(draftState)
  const charIdx = focusedCursorIdx - 1

  if (text && focusedCursorIdx > 0 && charIdx < text.length) {
    const focusedChar = text.get(charIdx)

    if (text.deleteAt) {
      text.deleteAt(charIdx)
      const replacementChar = charMapper(focusedChar)
      if (text.insertAt && replacementChar)
        text.insertAt(charIdx, replacementChar)
    }
  }
}

const mapBuffer = (
  bufferMapper: (buffer: string) => string
): DraftSyncRootMutator => (
  draftState: AppSyncRoot,
  _action: AppAction
): void => {
  const list = lastListInZoomPath(draftState)
  const text = zoomedText(draftState)
  const zoomCursorIdx = draftState.sexpZoomCursorIdx
  if (text && zoomCursorIdx > 0) {
    list[zoomCursorIdx - 1] = new Automerge.Text(bufferMapper(text.join('')))
  }
}

// TODO this should be an async task or something to handle effects
const copyCurrentSexpTextAtomToClipboard: DraftSyncRootMutator = (
  draftState,
  _action
): void => {
  let copied = false
  const text = zoomedText(draftState)
  if (text) copied = copy(text.join(''))
  if (!copied) {
    console.error('Could not copy to clipboard.')
  }
}

export const userlandKapps: UserlandKapp[] = [
  ...printableAsciiChars,
  ...sexpKapps,
  newlineChar,
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/upcase`,
    shortAsciiName: ':upcase',
    legend: ':upcase',
    instruction: mapFocusedChar((char: string): string => char.toUpperCase()),
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/downcase`,
    shortAsciiName: ':downcase',
    legend: ':downcase',
    instruction: mapFocusedChar((char: string): string => char.toLowerCase()),
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/delete`,
    shortAsciiName: ':backspace',
    legend: ':backspace',
    instruction: mapFocusedChar((_char: string): string => ''),
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
    shortAsciiName: ':copy!',
    legend: '📋:copy!',
    instruction: copyCurrentSexpTextAtomToClipboard,
  },
]

export const menuUpKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: `${idv0SystemPrefix}menu/up`,
  shortAsciiName: ':menu-up',
  legend: '🔼:menu-up',
  instruction: menuOut,
}

function undoInstruction(draftState: AppState, _action: AppAction): void {
  const syncRoot = draftState.syncRoot
  if (!syncRoot) return

  if (Automerge.canUndo(syncRoot)) {
    draftState.syncRoot = Automerge.undo(syncRoot, undoIdv0)
  }
  menuOutToRoot(draftState, _action)
}

function redoInstruction(draftState: AppState, _action: AppAction): void {
  const syncRoot = draftState.syncRoot
  if (!syncRoot) return

  if (Automerge.canRedo(syncRoot)) {
    draftState.syncRoot = Automerge.redo(syncRoot, redoIdv0)
  }
  menuOutToRoot(draftState, _action)
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

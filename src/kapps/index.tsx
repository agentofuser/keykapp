import * as Automerge from 'automerge'
import { filter, map } from 'fp-ts/es6/Array'
import {
  idv0SystemPrefix,
  idv0UserlandPrefix,
  modeInsertIdv0,
  modeMenuIdv0,
  redoIdv0,
  undoIdv0,
} from '../constants'
import { stringSaveAs } from '../kitchensink/effectfns'
import murmurhash from '../kitchensink/murmurhash'
import { menuOut, menuOutToRoot, recomputeMenuRoot } from '../navigation'
import {
  commitIfChanged,
  getCurrentFocusCursorIdx,
  updateTailSequenceFrequencies,
  zoomedText,
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
import {
  deleteKapp,
  zoomedListOnlyKapps,
  zoomedListOrTextKapps,
  zoomOutKapp,
} from './Sexp'

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

// TODO this should be an async task or something to handle effects
// const copyCurrentSexpTextAtomToClipboard: DraftSyncRootMutator = (
//   draftState,
//   _action
// ): void => {
//   let copied = false
//   const text = zoomedText(draftState)
//   if (text) copied = copy(text.join(''))
//   if (!copied) {
//     console.error('Could not copy to clipboard.')
//   }
// }

// TODO this should be an async task or something to handle effects
// function pasteInstruction(draftState: AppSyncRoot, action: AppAction): void {
//   const pastedString =
//     (action.type === 'KeyswitchUp' && action.middlewarePayload) || null
//   devStringyAndLog({ fn: 'pasteInstruction', pastedString })

//   const text = zoomedText(draftState)
//   if (text && text.insertAt && pastedString) {
//     const focusedCursorIdx = getCurrentFocusCursorIdx(draftState)
//     const clampedString = stringClamper(maxPasteLength - text.length)(
//       pastedString
//     )
//     text.insertAt(focusedCursorIdx, ...clampedString)
//     setFocusCursorIdx(
//       draftState,
//       text,
//       focusedCursorIdx + clampedString.length
//     )
//   }
// }

export const pasteIdv0 = `${idv0UserlandPrefix}text/paste`
export const zoomedTextOnlyKapps: UserlandKapp[] = [
  ...printableAsciiChars,
  newlineChar,
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}char/upcase`,
    shortAsciiName: ':upcase',
    legend: ':upcase',
    instruction: mapFocusedChar((char: string): string => char.toUpperCase()),
  },
  // {
  //   type: 'UserlandKapp',
  //   idv0: `${idv0UserlandPrefix}char/downcase`,
  //   shortAsciiName: ':downcase',
  //   legend: ':downcase',
  //   instruction: mapFocusedChar((char: string): string => char.toLowerCase()),
  // },
  // {
  //   type: 'UserlandKapp',
  //   idv0: `${idv0UserlandPrefix}text/copy`,
  //   shortAsciiName: ':copy!',
  //   legend: '📋:copy!',
  //   instruction: copyCurrentSexpTextAtomToClipboard,
  // },
  // {
  //   type: 'UserlandKapp',
  //   idv0: pasteIdv0,
  //   shortAsciiName: ':paste!',
  //   legend: '📋:paste!',
  //   instruction: pasteInstruction,
  // },
]

export const userlandKapps: UserlandKapp[] = [
  ...zoomedTextOnlyKapps,
  ...zoomedListOnlyKapps,
  ...zoomedListOrTextKapps,
]

export const menuUpKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: `${idv0SystemPrefix}menu/up`,
  shortAsciiName: ':menu-up',
  legend: '🔼:keypad-prev',
  instruction: menuOut,
}

export const inputModeInsertKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: modeInsertIdv0,
  shortAsciiName: ':mode-insert',
  legend: '🔠:mode-insert',
  instruction: modeInsert,
}

export const inputModeMenuKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: modeMenuIdv0,
  shortAsciiName: ':mode-menu',
  legend: '🌲:mode-menu',
  instruction: modeMenu,
}

function undoInstruction(draftState: AppState, _action: AppAction): AppState {
  const syncRoot = draftState.syncRoot
  if (!syncRoot) return draftState

  const prevState = draftState
  draftState = { ...prevState }

  if (Automerge.canUndo(syncRoot)) {
    draftState.syncRoot = Automerge.undo(syncRoot, undoIdv0)
    draftState.tempRoot.kappIdv0Log.push(undoIdv0)
  }
  updateTailSequenceFrequencies(draftState)
  recomputeMenuRoot(draftState)
  menuOutToRoot(draftState, _action)
  const nextState = draftState
  commitIfChanged(prevState, nextState, undoIdv0)
  return nextState
}

function redoInstruction(draftState: AppState, _action: AppAction): AppState {
  const syncRoot = draftState.syncRoot
  if (!syncRoot) return draftState

  const prevState = draftState
  draftState = { ...prevState }

  if (Automerge.canRedo(syncRoot)) {
    draftState.syncRoot = Automerge.redo(syncRoot, redoIdv0)
    draftState.tempRoot.kappIdv0Log.push(redoIdv0)
  }
  updateTailSequenceFrequencies(draftState)
  recomputeMenuRoot(draftState)
  menuOutToRoot(draftState, _action)
  const nextState = draftState
  commitIfChanged(prevState, nextState, redoIdv0)
  return nextState
}

function modeInsert(draftState: AppState, _action: AppAction): AppState {
  const prevState = draftState
  draftState = { ...prevState }

  console.log('Entering insert mode')

  draftState.tempRoot.inputMode = 'InsertMode'
  draftState.tempRoot.kappIdv0Log.push(modeInsertIdv0)

  updateTailSequenceFrequencies(draftState)
  recomputeMenuRoot(draftState)
  menuOutToRoot(draftState, _action)
  const nextState = draftState
  commitIfChanged(prevState, nextState, modeInsertIdv0)
  return nextState
}

function modeMenu(draftState: AppState, _action: AppAction): AppState {
  const prevState = draftState
  draftState = { ...prevState }

  console.log('Entering menu mode')

  draftState.tempRoot.inputMode = 'MenuMode'
  draftState.tempRoot.kappIdv0Log.push(modeMenuIdv0)

  updateTailSequenceFrequencies(draftState)
  recomputeMenuRoot(draftState)
  menuOutToRoot(draftState, _action)
  const nextState = draftState
  commitIfChanged(prevState, nextState, modeMenuIdv0)
  return nextState
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

const exportIdv0 = `${idv0SystemPrefix}syncRoot/export`

// TODO this should be an async task or something to handle effects
function exportInstruction(
  draftState: AppState,
  _action: AppAction
): AppState {
  const prevState = draftState
  draftState = { ...prevState }

  const { syncRoot } = draftState
  let serializedSyncRoot
  if (syncRoot) {
    serializedSyncRoot = Automerge.save(syncRoot)
    stringSaveAs(serializedSyncRoot, 'keykapp-sync-root.json')
  }

  draftState.tempRoot.kappIdv0Log.push(exportIdv0)
  updateTailSequenceFrequencies(draftState)
  recomputeMenuRoot(draftState)
  menuOutToRoot(draftState, _action)
  const nextState = draftState
  commitIfChanged(prevState, nextState, exportIdv0)
  return nextState
}

const exportKapp: SystemKapp = {
  type: 'SystemKapp',
  idv0: exportIdv0,
  shortAsciiName: ':export!',
  legend: ':export!',
  instruction: exportInstruction,
}

export const systemKapps: SystemKapp[] = [
  menuUpKapp,
  undoKapp,
  redoKapp,
  exportKapp,
  inputModeInsertKapp,
  inputModeMenuKapp,
]

export const allKapps: Kapp[] = [...userlandKapps, ...systemKapps]

export const listModeKapps: Kapp[] = [
  ...zoomedListOnlyKapps,
  ...zoomedListOrTextKapps,
  undoKapp,
  redoKapp,
  exportKapp,
]

export const textModeKapps: Kapp[] = [
  ...zoomedTextOnlyKapps,
  // ...zoomedListOrTextKapps,
  // undoKapp,
  // redoKapp,
  // exportKapp,
  zoomOutKapp,
  deleteKapp,
]

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
  const shortened = int % 360
  return 'hsl(' + shortened + `,${saturation}%,${lighting}%)`
}

export function kappColor(kapp: Kapp, saturation = 90, lighting = 87): string {
  return intToHSL(murmurhash(kapp.idv0, 42), saturation, lighting)
}

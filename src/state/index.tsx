import { last, map, reduce } from 'fp-ts/es6/Array'
import { map as optionMap, Option } from 'fp-ts/es6/Option'
import produce, { enableAllPlugins } from 'immer'
import * as nGram from 'n-gram'
import { Dispatch } from 'react'
import { nGramRange, spacebarKeyswitch } from '../constants'
import {
  findKappById,
  inputModeMenuKapp,
  listModeKapps,
  menuUpKapp,
  pasteIdv0,
} from '../kapps'
import { Sexp } from '../kapps/Sexp'
import { menuIn, menuOutToRoot, recomputeMenuRoot } from '../navigation'
import { newHuffmanRoot } from '../navigation/huffman'
import {
  AppAction,
  AppState,
  AppSyncRoot,
  AppTempRoot,
  Kapp,
  Keybinding,
  Keystroke,
  Keyswitch,
  NGrammer,
  SexpInfo,
  SexpList,
  SexpNode,
  SexpText,
  Waypoint,
} from '../types'
import savedSyncRoot from '../datasets/keykapp-sync-root.json'

// immerjs
enableAllPlugins()

export function makeInitialSyncRoot(): AppSyncRoot {
  // return {
  //   sexp: Sexp.List.from([]),
  //   sexpMetadata: {},
  //   sexpListZoomPath: [],
  //   sexpZoomCursorIdx: 0,
  //   keystrokeHistory: [],
  // }
  return savedSyncRoot as AppSyncRoot
}

export function makeInitialAppState(): AppState {
  const initialHuffmanRoot = newHuffmanRoot({ kapps: listModeKapps })

  const syncRoot = makeInitialSyncRoot()

  const tempRoot: AppTempRoot = {
    kappIdv0Log: [],
    keybindingBreadcrumbs: [[spacebarKeyswitch, initialHuffmanRoot]],
    menuIns: [],
    sequenceFrequencies: {},
    keyUpCount: 0,
    inputMode: 'MenuMode',
  }

  const initialAppState: AppState = { syncRoot, tempRoot }
  return initialAppState
}

export function dispatchMiddleware(
  dispatch: Dispatch<AppAction>
): (action: AppAction) => void {
  return async (action): Promise<void> => {
    switch (action.type) {
      case 'KeyswitchUp':
        const [_keyswitch, waypoint] = action.data.keybinding
        const kappIdv0 = waypoint.value.kappIdv0
        if (kappIdv0 === pasteIdv0) {
          const pastedString = await navigator.clipboard.readText()
          dispatch({ ...action, middlewarePayload: pastedString })
        } else {
          dispatch(action)
        }
        break
      default:
        dispatch(action)
        break
    }
  }
}

export function currentWaypoint(state: AppState): Option<Waypoint> {
  const waypointOption = last(state.tempRoot.keybindingBreadcrumbs)
  return optionMap(([_keyswitch, waypoint]: Keybinding): Waypoint => waypoint)(
    waypointOption
  )
}

export function lastListInZoomPath(syncRoot: AppSyncRoot): SexpList {
  let selectedList = syncRoot.sexp
  for (const index of syncRoot.sexpListZoomPath) {
    selectedList = selectedList.children[index] as SexpList
  }
  return selectedList
}

export function zoomLevel(syncRoot: AppSyncRoot): 'atom' | 'list' {
  const zoomCursorIdx = syncRoot.sexpZoomCursorIdx
  return zoomCursorIdx > 0 ? 'atom' : 'list'
}

export function currentMode(syncRoot: AppSyncRoot): 'text-mode' | 'list-mode' {
  return zoomLevel(syncRoot) === 'list' ? 'list-mode' : 'text-mode'
}

export function parentList(syncRoot: AppSyncRoot): SexpList | null {
  let secondToLastList = null
  let lastList = syncRoot.sexp
  for (const index of syncRoot.sexpListZoomPath) {
    if (index > 0) secondToLastList = lastList
    lastList = lastList.children[index]
  }
  return zoomLevel(syncRoot) === 'atom' ? lastList : secondToLastList
}

export function zoomedSexp(syncRoot: AppSyncRoot): SexpNode {
  const list = lastListInZoomPath(syncRoot)
  const cursorIdx = syncRoot.sexpZoomCursorIdx
  const sexp = cursorIdx > 0 ? list.children[cursorIdx - 1] : list
  return sexp
}

function zoomedSexpAndInfo(
  syncRoot: AppSyncRoot
): { sexp: SexpNode; info: SexpInfo } {
  const sexp = zoomedSexp(syncRoot)
  const info = syncRoot.sexpMetadata[sexp.uuid]
  return { sexp, info }
}

export function zoomedList(syncRoot: AppSyncRoot): SexpList | null {
  const sexp = zoomedSexp(syncRoot)
  if ((sexp as SexpList).children) {
    return sexp as SexpList
  } else {
    return null
  }
}

export function getCurrentFocusCursorIdx(syncRoot: AppSyncRoot): number {
  const { info, sexp } = zoomedSexpAndInfo(syncRoot)
  const length = Sexp.isText(sexp) ? sexp.value.length : sexp.children.length
  const cursorIdx = info ? info.focusCursorIdx : length

  return cursorIdx
}

export function focusedSexp(syncRoot: AppSyncRoot): SexpNode | null {
  const list = zoomedList(syncRoot)

  let result
  if (list) {
    const idx = getCurrentFocusCursorIdx(syncRoot) - 1
    result = list.children[idx]
  } else {
    result = null
  }
  return result
}

export function zoomedText(syncRoot: AppSyncRoot): SexpText | null {
  const sexp = zoomedSexp(syncRoot)
  if ((sexp as SexpText).value !== undefined) {
    return sexp as SexpText
  } else {
    return null
  }
}

export function isSexpItemFocused(
  syncRoot: AppSyncRoot,
  sexp: SexpNode
): boolean {
  const list: SexpList = zoomedList(syncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(syncRoot)
  return list.children.indexOf(sexp) === focusCursorIdx - 1
}

export function setFocusCursorIdx(
  draftSyncRoot: AppSyncRoot,
  sexp: SexpNode,
  focusCursorIdx: number | undefined
): void {
  if (focusCursorIdx === undefined) {
    delete draftSyncRoot.sexpMetadata[sexp.uuid]
  } else {
    const info = draftSyncRoot.sexpMetadata[sexp.uuid]
    if (info) {
      info.focusCursorIdx = focusCursorIdx
    } else {
      draftSyncRoot.sexpMetadata[sexp.uuid] = {
        focusCursorIdx,
      }
    }
  }
}

export function logKappExecution(tempRoot: AppTempRoot, kapp: Kapp): void {
  tempRoot.kappIdv0Log.push(kapp.idv0)
}

export function updateSequenceFrequencies(draftState: AppState): void {
  if (!draftState.syncRoot) return
  const kappLog = draftState.tempRoot.kappIdv0Log
  const kGrammers = map((k): NGrammer => nGram(k))(nGramRange)
  draftState.tempRoot.sequenceFrequencies = reduce(
    draftState.tempRoot.sequenceFrequencies,
    (
      seqFreqs: { [key: string]: number },
      kGrammer: NGrammer
    ): { [key: string]: number } => {
      const kGrams = kGrammer(kappLog)
      kGrams.forEach((kGram: string[]): void => {
        const key = kGram.join('\n')
        const value = (seqFreqs[key] || 0) + 1
        seqFreqs[key] = value
      })
      return seqFreqs
    }
  )(kGrammers)
}

export function updateTailSequenceFrequencies(draftState: AppState): void {
  if (draftState.syncRoot === null) return
  const seqFreqs = draftState.tempRoot.sequenceFrequencies
  const kappIdv0Log = draftState.tempRoot.kappIdv0Log
  nGramRange
    .filter((k: number): boolean => k <= kappIdv0Log.length)
    .map((k: number): string[] => {
      const lookbackIndex = -k

      const logSlice = kappIdv0Log.slice(lookbackIndex)
      return logSlice
    })
    .forEach((kGram: string[]): void => {
      const key = kGram.join('\n')
      const value = (seqFreqs[key] || 0) + 1

      seqFreqs[key] = value
    })
}

function afterSyncRootSwap(nextState: {
  syncRoot: AppSyncRoot | null
  tempRoot: AppTempRoot
}): void {
  console.info('Calculating n-grams for kapp prediction...')
  updateSequenceFrequencies(nextState)
  console.info('Done calculating n-grams.')
  console.info('Updating huffman menu tree...')
  recomputeMenuRoot(nextState)
  console.info('Keykapp is ready to use.')
}

function logKeystroke(prevState: AppState, keyswitch: Keyswitch): AppState {
  const nextState = { ...prevState }
  const huffmanTreeDepth = prevState.tempRoot.keybindingBreadcrumbs.length - 1
  const keystroke: Keystroke = {
    timestamp: Date.now(),
    keyswitch,
    huffmanTreeDepth,
  }
  if (nextState.syncRoot) {
    nextState.syncRoot = produce(
      prevState.syncRoot,
      (draftSyncRoot: AppSyncRoot): void => {
        draftSyncRoot.keystrokeHistory.push(keystroke)
      }
    )
  }
  return nextState
}

export function appReducer(prevState: AppState, action: AppAction): AppState {
  let nextState = { ...prevState }
  switch (action.type) {
    case 'LoadSyncRoot':
      {
        if (!nextState.syncRoot) {
          nextState.syncRoot = action.data.syncRoot
          afterSyncRootSwap(nextState)
        }
      }
      break
    case 'KeyswitchUp':
      {
        nextState.tempRoot.keyUpCount++
        const [keyswitch, waypoint] = action.data.keybinding
        const kappIdv0 = waypoint.value.kappIdv0
        const kapp = kappIdv0 && findKappById(kappIdv0)
        const isKappWaypoint = !!kappIdv0
        const isMenuWaypoint = !isKappWaypoint

        // prevState marks the last committed syncRoot change so it can be
        // diffed by produce()
        prevState = logKeystroke(prevState, keyswitch)
        nextState = { ...prevState }

        // a menu is a non-leaf waypoint
        if (isMenuWaypoint) {
          menuIn(action.data.keybinding)(nextState, action)
        } else if (
          kappIdv0 &&
          kapp &&
          prevState.syncRoot &&
          nextState.syncRoot
        ) {
          if (kapp.type === 'UserlandKapp') {
            nextState.syncRoot = produce(
              prevState.syncRoot,
              (draftSyncRoot: AppSyncRoot): void => {
                kapp.instruction(draftSyncRoot, action)
                logKappExecution(nextState.tempRoot, kapp)
              }
            )

            updateTailSequenceFrequencies(nextState)
            recomputeMenuRoot(nextState)

            menuOutToRoot(nextState, action)
          } else if (kapp.type === 'SystemKapp') {
            nextState = kapp.instruction(prevState, action)
          }
        }
      }
      break

    case 'KeypadUp':
      {
        prevState = logKeystroke(prevState, spacebarKeyswitch)
        nextState = { ...prevState }
        nextState = menuUpKapp.instruction(nextState, action)
      }
      break

    case 'InputModeMenu':
      {
        prevState = logKeystroke(prevState, action.data.keybinding[0])
        nextState = { ...prevState }
        nextState = inputModeMenuKapp.instruction(nextState, action)
      }
      break

    case 'RunKapp':
      {
        const kappIdv0 = action.data.kappIdv0
        const kapp = kappIdv0 && findKappById(kappIdv0)
        if (kapp && kapp.type === 'UserlandKapp') {
          nextState.syncRoot = produce(
            prevState.syncRoot,
            (draftSyncRoot: AppSyncRoot): void => {
              kapp.instruction(draftSyncRoot, action)
              logKappExecution(nextState.tempRoot, kapp)
            }
          )

          updateTailSequenceFrequencies(nextState)
          recomputeMenuRoot(nextState)

          menuOutToRoot(nextState, action)
        }
      }
      break
    default:
      break
  }

  return nextState
}

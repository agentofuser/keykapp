import * as FS from '@isomorphic-git/lightning-fs'
import * as Automerge from 'automerge'
import { last, map, reduce } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { Option, map as optionMap } from 'fp-ts/es6/Option'
import * as git from 'isomorphic-git'
import * as nGram from 'n-gram'
import { Dispatch } from 'react'
import { gitRepoDir, nGramRange, spacebarKeyswitch } from '../constants'
import {
  findKappById,
  menuUpKapp,
  pasteIdv0,
  zoomedTextOnlyKapps,
} from '../kapps'
import { devStringifyAndLog } from '../kitchensink/effectfns'
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
  Sexp,
  SexpInfo,
  SexpList,
  Waypoint,
} from '../types'

export async function setupGit(): Promise<boolean> {
  console.info('Configuring LightningFS...')
  const _fs = new FS('keykappUser')
  window.fs = _fs
  console.info('Done configuring LightningFS.')
  git.plugins.set('fs', window.fs)
  console.info('Running git.clone()...')
  // FIXME: this is in "works on my machine" state. make it usable to
  // other people.
  await git.clone({
    dir: gitRepoDir,
    corsProxy: 'http://localhost:9999',
    url: 'http://localhost:8080',
    noGitSuffix: true,
  })

  return true
}

// give keybase time to process pushes before sending a new one.
let isPushResponsePending = false
let pushesPending = 0

function flushGitPushQueue(): Promise<any> {
  if (pushesPending === 0) return Promise.resolve('Nothing to push.')

  if (isPushResponsePending) {
    return Promise.resolve(
      'Waiting for ongoing push to conclude. Retrying soon...'
    )
  }

  isPushResponsePending = true
  pushesPending = 0
  console.log(
    "Backing up to filesystem git repo. (And from there to Keybase if that's properly set up.)"
  )
  return git
    .push({
      dir: gitRepoDir,
      remote: 'origin',
      noGitSuffix: true,
    })
    .then((_res: git.PushResponse): any => {
      isPushResponsePending = false
      if (pushesPending > 0) {
        return flushGitPushQueue()
      } else {
        const msg = 'Git push queue empty. Filesystem backup successful.'
        console.log(msg)
        return msg
      }
    })
    .catch((message: any): void => {
      isPushResponsePending = false
      devStringifyAndLog(message)
    })
}

function enqueueGitPush(): Promise<any> {
  pushesPending = pushesPending + 1
  return flushGitPushQueue()
}

function commitChanges(
  messageTitle: string,
  changes: Automerge.Change[]
): any {
  const serializedChanges = JSON.stringify(changes, null, 2)
  const message = `${messageTitle}\n\n${serializedChanges}`

  return git
    .commit({
      dir: gitRepoDir,
      author: {
        name: 'Keykapp Syncbot',
        email: 'syncbot@keykapp.com',
      },
      message,
    })
    .then((_sha: string) => {
      return enqueueGitPush()
    })
}

export function makeInitialAppState(): AppState {
  const initialHuffmanRoot = newHuffmanRoot({ kapps: zoomedTextOnlyKapps })

  const syncRoot = null

  const tempRoot: AppTempRoot = {
    kappIdv0Log: [],
    keybindingBreadcrumbs: [[spacebarKeyswitch, initialHuffmanRoot]],
    menuIns: [],
    sequenceFrequencies: {},
    keyUpCount: 0,
  }

  const initialAppState: AppState = { syncRoot, tempRoot }
  return initialAppState
}

export function makeInitialSyncRoot(): AppSyncRoot {
  return Automerge.from({
    sexp: [],
    sexpMetadata: {},
    sexpListZoomPath: [],
    sexpZoomCursorIdx: 0,
    keystrokeHistory: [],
  })
}

function migrateSyncRootSchema(syncRoot: AppSyncRoot): AppSyncRoot {
  return Automerge.change(
    syncRoot,
    'migrateSyncRootSchema',
    (doc: AppSyncRoot): void => {
      if (doc.sexp === undefined) {
        doc.sexp = [new Automerge.Text('')]
      }
      if (doc.sexpListZoomPath === undefined) {
        doc.sexpListZoomPath = []
      }
      if (doc.sexpZoomCursorIdx === undefined) {
        doc.sexpZoomCursorIdx = 1
      }
      if (doc.sexpMetadata === undefined) {
        doc.sexpMetadata = {}
      }
      if ((doc as any).kappIdv0Log !== undefined) {
        delete (doc as any).kappIdv0Log
      }
      if (doc.keystrokeHistory === undefined) {
        doc.keystrokeHistory = []
      }
    }
  )
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

export async function loadSyncRootFromBrowserGit(
  state: AppState,
  dispatch: Dispatch<AppAction>
): Promise<void> {
  if (!state.syncRoot) {
    let syncRoot: AppSyncRoot | null = null
    try {
      const commits = await git.log({
        dir: gitRepoDir,
      })
      console.info(`Loaded ${commits.length} commits from git log.`)

      console.info('Parsing commit messages into Automerge changes...')
      const syncRootChanges = reduce(
        [],
        (
          allChanges: Automerge.Change[],
          commit: git.CommitDescription
        ): Automerge.Change[] => {
          const lines = commit.message.split('\n')
          const kappIdv0 = lines[0].startsWith('/') && lines[0]
          kappIdv0 && state.tempRoot.kappIdv0Log.push(kappIdv0)

          const payload = lines.slice(2).join('\n')

          const changes = JSON.parse(payload)

          return allChanges.concat(changes)
        }
      )(commits.reverse())

      console.info('Done parsing Automerge changes.')

      console.info('Applying Automerge changes to base state...')
      syncRoot = Automerge.applyChanges(Automerge.init(), syncRootChanges)

      const migratedSyncRoot = migrateSyncRootSchema(syncRoot)
      const migrationChanges = Automerge.getChanges(syncRoot, migratedSyncRoot)
      if (migrationChanges.length > 0) {
        await commitChanges('schemaMigration', migrationChanges)
      }
      syncRoot = migratedSyncRoot

      console.info('Finished applying changes.')

      if (syncRoot) {
        dispatchMiddleware(dispatch)({
          type: 'LoadSyncRootFromBrowserGit',
          data: { timestamp: Date.now(), syncRoot },
        })
      }
    } catch (e) {
      console.error(e)
      devStringifyAndLog(e)
      throw e
      // const initialSyncRoot = makeInitialSyncRoot()
      // const initialChanges = Automerge.getChanges(
      //   Automerge.init(),
      //   initialSyncRoot
      // )
      // if (initialChanges.length > 0) {
      //   await commitChanges('initialSyncRoot', initialChanges)
      // }

      // syncRoot = initialSyncRoot
      // } finally {
      // }
    }
  }
}

export function currentWaypoint(state: AppState): Option<Waypoint> {
  const waypointOption = last(state.tempRoot.keybindingBreadcrumbs)
  return optionMap(([_keyswitch, waypoint]:Keybinding): Waypoint => waypoint)(waypointOption)
}

export function lastListInZoomPath(syncRoot: AppSyncRoot): SexpList {
  let selectedList = syncRoot.sexp
  for (const index of syncRoot.sexpListZoomPath) {
    selectedList = selectedList[index]
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
    lastList = lastList[index]
  }
  return zoomLevel(syncRoot) === 'atom' ? lastList : secondToLastList
}

export function zoomedSexp(syncRoot: AppSyncRoot): Sexp {
  const list = lastListInZoomPath(syncRoot)
  const cursorIdx = syncRoot.sexpZoomCursorIdx
  const sexp = cursorIdx > 0 ? list[cursorIdx - 1] : list
  return sexp
}

function zoomedSexpAndInfo(
  syncRoot: AppSyncRoot
): { sexp: Sexp; info: SexpInfo } {
  const sexp = zoomedSexp(syncRoot)
  const info = syncRoot.sexpMetadata[Automerge.getObjectId(sexp)]
  return { sexp, info }
}

export function zoomedList(syncRoot: AppSyncRoot): SexpList | null {
  if (zoomLevel(syncRoot) === 'list') {
    return zoomedSexp(syncRoot)
  } else {
    return null
  }
}

export function getCurrentFocusCursorIdx(syncRoot: AppSyncRoot): number {
  const { info, sexp } = zoomedSexpAndInfo(syncRoot)
  const cursorIdx = info ? info.focusCursorIdx : sexp.length
  return cursorIdx
}

export function focusedSexp(syncRoot: AppSyncRoot): Sexp | null {
  const list = zoomedList(syncRoot)
  if (list) {
    const idx = getCurrentFocusCursorIdx(syncRoot) - 1
    return list[idx]
  } else {
    return null
  }
}

export function zoomedText(syncRoot: AppSyncRoot): Automerge.Text | null {
  const sexp = zoomedSexp(syncRoot)
  if (sexp instanceof Automerge.Text) {
    return sexp
  } else {
    return null
  }
}

export function isSexpItemFocused(syncRoot: AppSyncRoot, sexp: Sexp): boolean {
  const list: Automerge.List<any> = zoomedSexp(syncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(syncRoot)
  return list.indexOf(sexp) === focusCursorIdx - 1
}

export function setFocusCursorIdx(
  draftSyncRoot: AppSyncRoot,
  sexp: Sexp,
  focusCursorIdx: number | undefined
): void {
  if (focusCursorIdx === undefined) {
    delete draftSyncRoot.sexpMetadata[Automerge.getObjectId(sexp)]
  } else {
    const info = draftSyncRoot.sexpMetadata[Automerge.getObjectId(sexp)]
    if (info) {
      info.focusCursorIdx = focusCursorIdx
    } else {
      draftSyncRoot.sexpMetadata[Automerge.getObjectId(sexp)] = {
        focusCursorIdx,
      }
    }
  }
}

export function logKappExecution(tempRoot: AppTempRoot, kapp: Kapp): void {
  tempRoot.kappIdv0Log.push(kapp.idv0)
}

export function rootWaypoint(state: AppState): Waypoint {
  return head(state.tempRoot.keybindingBreadcrumbs)
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
  syncRoot: Automerge.FreezeObject<AppSyncRoot> | null
  tempRoot: AppTempRoot
}): void {
  console.info('Calculating n-grams for kapp prediction...')
  updateSequenceFrequencies(nextState)
  console.info('Done calculating n-grams.')
  console.info('Updating huffman menu tree...')
  recomputeMenuRoot(nextState)
  console.info('Keykapp is ready to use.')
}

export function commitIfChanged(
  prevState: AppState,
  nextState: {
    syncRoot: Automerge.FreezeObject<AppSyncRoot> | null
    tempRoot: AppTempRoot
  },
  message: string
): void {
  if (prevState.syncRoot && nextState.syncRoot) {
    const changes = Automerge.getChanges(
      prevState.syncRoot,
      nextState.syncRoot
    )
    if (changes.length > 0) {
      commitChanges(message, changes)
    }
  }
}

function logKeystroke(
  prevState: AppState,
  keyswitch: Keyswitch,
  nextState: {
    syncRoot: Automerge.FreezeObject<AppSyncRoot> | null
    tempRoot: AppTempRoot
  }
): void {
  const huffmanTreeDepth = prevState.tempRoot.keybindingBreadcrumbs.length - 1
  const keystroke: Keystroke = {
    timestamp: Date.now(),
    keyswitch,
    huffmanTreeDepth,
  }
  if (nextState.syncRoot) {
    nextState.syncRoot = Automerge.change(
      prevState.syncRoot,
      'syncRoot.keystrokeHistory.push()',
      (draftSyncRoot: AppSyncRoot): void => {
        draftSyncRoot.keystrokeHistory.push(keystroke)
      }
    )
    commitIfChanged(prevState, nextState, 'syncRoot.keystrokeHistory.push()')
  }
}

export function appReducer(prevState: AppState, action: AppAction): AppState {
  let nextState = { ...prevState }
  switch (action.type) {
    case 'LoadSyncRootFromBrowserGit':
      if (!nextState.syncRoot) {
        nextState.syncRoot = action.data.syncRoot
        afterSyncRootSwap(nextState)
      }
      break
    case 'KeyswitchUp':
      nextState.tempRoot.keyUpCount++
      const [keyswitch, waypoint] = action.data.keybinding
      const kappIdv0 = waypoint.value.kappIdv0
      const kapp = kappIdv0 && findKappById(kappIdv0)
      const isKappWaypoint = !!kappIdv0
      const isMenuWaypoint = !isKappWaypoint

      logKeystroke(prevState, keyswitch, nextState)

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
          nextState.syncRoot = Automerge.change(
            prevState.syncRoot,
            kappIdv0,
            (draftSyncRoot: AppSyncRoot): void => {
              kapp.instruction(draftSyncRoot, action)
              logKappExecution(nextState.tempRoot, kapp)
            }
          )

          updateTailSequenceFrequencies(nextState)
          recomputeMenuRoot(nextState)

          menuOutToRoot(nextState, action)

          commitIfChanged(prevState, nextState, kappIdv0)
        } else if (kapp.type === 'SystemKapp') {
          nextState = kapp.instruction(nextState, action)
        }
      }

      break

    case 'KeypadUp':
      logKeystroke(prevState, spacebarKeyswitch, nextState)
      nextState = menuUpKapp.instruction(nextState, action)
      break

    default:
      break
  }

  return nextState
}

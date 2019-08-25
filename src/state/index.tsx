import * as Automerge from 'automerge'
import * as BrowserFS from 'browserfs'
import { last, map, reduce } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { Option } from 'fp-ts/es6/Option'
import * as git from 'isomorphic-git'
import * as nGram from 'n-gram'
import { Dispatch } from 'react'
import { gitRepoDir, incrementManualWeight, nGramRange } from '../constants'
import { findKappById } from '../kapps'
import { logDev } from '../kitchensink/effectfns'
import { zoomInto, zoomOutToRoot } from '../navigation'
import { newHuffmanRoot } from '../navigation/huffman'
import {
  AppAction,
  AppState,
  AppSyncRoot,
  AppTempRoot,
  Kapp,
  NGrammer,
  Sexp,
  SexpInfo,
  SexpList,
  Waypoint,
} from '../types'

const placeholderText =
  'Hi there! Welcome to Keykapp :) Make yourself at home, and please give me feedback at twitter.com/keykapp. Thank you for stopping by! — @agentofuser'

export function setupGit(): Promise<boolean> {
  return new Promise((resolve, reject): void => {
    BrowserFS.configure(
      {
        fs: 'AsyncMirror',
        options: {
          sync: { fs: 'InMemory' },
          async: {
            fs: 'IndexedDB',
            options: {
              storeName: 'keykappUser',
            },
          },
        },
      },
      async function(e): Promise<void> {
        let isGitReady = false
        if (e) {
          reject(isGitReady)
          console.error(e)
          return
        }
        window.fs = BrowserFS.BFSRequire('fs')
        git.plugins.set('fs', window.fs)
        await git.init({ dir: gitRepoDir })

        isGitReady = true
        resolve(isGitReady)
      }
    )
  })
}

function commitChanges(
  messageTitle: string,
  changes: Automerge.Change[]
): Promise<string> {
  const serializedChanges = JSON.stringify(changes, null, 2)
  const message = `${messageTitle}\n\n${serializedChanges}`
  logDev(message)

  return git.commit({
    dir: gitRepoDir,
    author: {
      name: 'Keykapp Syncbot',
      email: 'syncbot@keykapp.com',
    },
    message,
  })
}

export function makeInitialAppState(): AppState {
  const initialHuffmanRoot = newHuffmanRoot({})

  const syncRoot = null

  const tempRoot: AppTempRoot = {
    waypointBreadcrumbs: [initialHuffmanRoot],
    sequenceFrequencies: {},
  }

  const initialAppState: AppState = { syncRoot, tempRoot }
  return initialAppState
}

export function makeInitialSyncRoot(): AppSyncRoot {
  return Automerge.from({
    kappIdv0Log: [],
    sexp: [new Automerge.Text(placeholderText)],
    sexpMetadata: {},
    sexpListZoomPath: [],
    sexpZoomCursorIdx: 1,
  })
}

function migrateSyncRootSchema(syncRoot: AppSyncRoot): AppSyncRoot | null {
  return Automerge.change(
    syncRoot,
    'migrateSyncRootSchema',
    (doc: AppSyncRoot): void => {
      if (doc.sexp === undefined || doc.sexp.length === 0) {
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
    }
  )
}

export async function loadSyncRootFromBrowserGit(
  state: AppState,
  dispatch: Dispatch<AppAction>
): Promise<void> {
  if (!state.syncRoot) {
    let syncRoot: AppSyncRoot | null = null
    try {
      let commits = await git.log({
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
          const kappIdv0 = lines[0]
          incrementManualWeight(kappIdv0)

          const payload = lines.slice(2).join('\n')

          let changes = JSON.parse(payload)
          return allChanges.concat(changes)
        }
      )(commits)

      console.info('Done parsing Automerge changes.')

      console.info('Applying Automerge changes to base state...')
      syncRoot = Automerge.applyChanges(Automerge.init(), syncRootChanges)

      syncRoot = migrateSyncRootSchema(syncRoot)

      console.info('Finished applying changes.')
    } catch (_e) {
      const initialSyncRoot = makeInitialSyncRoot()
      let initialChanges = Automerge.getChanges(
        Automerge.init(),
        initialSyncRoot
      )
      if (initialChanges.length > 0) {
        await commitChanges('initialSyncRoot', initialChanges)
      }

      syncRoot = initialSyncRoot
    } finally {
      if (syncRoot) {
        dispatch({
          type: 'LoadSyncRootFromBrowserGit',
          data: { timestamp: Date.now(), syncRoot },
        })
      }
    }
  }
}

export function currentWaypoint(state: AppState): Option<Waypoint> {
  const waypointOption = last(state.tempRoot.waypointBreadcrumbs)
  return waypointOption
}

export function currentSexpList(syncRoot: AppSyncRoot): SexpList {
  let selectedList = syncRoot.sexp
  for (let index of syncRoot.sexpListZoomPath) {
    selectedList = selectedList[index]
  }
  return selectedList
}

export function currentSexp(syncRoot: AppSyncRoot): Sexp {
  const list = currentSexpList(syncRoot)
  const cursorIdx = syncRoot.sexpZoomCursorIdx
  const sexp = cursorIdx > 0 ? list[cursorIdx - 1] : list
  return sexp
}

export function currentSexpTextAtom(
  syncRoot: AppSyncRoot
): Automerge.Text | null {
  const sexp = currentSexp(syncRoot)
  if (sexp instanceof Automerge.Text) {
    return sexp
  } else {
    return null
  }
}

function currentSexpAndInfo(
  syncRoot: AppSyncRoot
): { sexp: Sexp; info: SexpInfo } {
  const sexp = currentSexp(syncRoot)
  const info = syncRoot.sexpMetadata[Automerge.getObjectId(sexp)]
  return { sexp, info }
}

export function getCurrentFocusCursorIdx(syncRoot: AppSyncRoot): number {
  const { info, sexp } = currentSexpAndInfo(syncRoot)
  const cursorIdx = info ? info.focusCursorIdx : sexp.length
  return cursorIdx
}

export function setFocusCursorIdx(
  syncRoot: AppSyncRoot,
  sexp: Sexp,
  focusCursorIdx: number
): void {
  const info = syncRoot.sexpMetadata[Automerge.getObjectId(sexp)]
  if (info) {
    info.focusCursorIdx = focusCursorIdx
  } else {
    syncRoot.sexpMetadata[Automerge.getObjectId(sexp)] = { focusCursorIdx }
  }
}

export function logKappExecution(
  draftSyncRoot: AppSyncRoot,
  kapp: Kapp
): void {
  draftSyncRoot.kappIdv0Log.push(kapp.idv0)
}

export function rootWaypoint(state: AppState): Waypoint {
  return head(state.tempRoot.waypointBreadcrumbs)
}

function updateSequenceFrequencies(draftState: AppState): void {
  if (!draftState.syncRoot) return
  const kappLog = draftState.syncRoot.kappIdv0Log
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

function updateTailSequenceFrequencies(draftState: AppState): void {
  if (draftState.syncRoot === null) return
  const seqFreqs = draftState.tempRoot.sequenceFrequencies
  const kappIdv0Log = draftState.syncRoot.kappIdv0Log
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

export function appReducer(prevState: AppState, action: AppAction): AppState {
  let nextState = { ...prevState }
  switch (action.type) {
    case 'LoadSyncRootFromBrowserGit':
      if (!nextState.syncRoot) {
        nextState.syncRoot = action.data.syncRoot
        console.info('Calculating n-grams for kapp prediction...')
        updateSequenceFrequencies(nextState)
        console.info('Done calculating n-grams. Keykapp is ready to use.')
      }
      break
    case 'KeyswitchUp':
      const [_keyswitch, waypoint] = action.data.keybinding
      const kappIdv0 = waypoint.value.kappIdv0
      const kapp = kappIdv0 && findKappById(kappIdv0)
      const isKappWaypoint = !!kappIdv0
      const isMenuWaypoint = !isKappWaypoint

      // a menu is a non-leaf waypoint
      if (isMenuWaypoint) {
        zoomInto(waypoint)(nextState, action)
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
              logKappExecution(draftSyncRoot, kapp)
            }
          )

          updateTailSequenceFrequencies(nextState)
          // Update huffman tree based on kapp's updated weight calculated
          // from the kappLog
          nextState.tempRoot.waypointBreadcrumbs = [
            newHuffmanRoot({
              state: nextState,
            }),
          ]

          zoomOutToRoot(nextState, action)
        } else if (kapp.type === 'SystemKapp') {
          kapp.instruction(nextState, action)
        }

        let changes = Automerge.getChanges(
          prevState.syncRoot,
          nextState.syncRoot
        )
        if (changes.length > 0) {
          commitChanges(kappIdv0, changes)
          incrementManualWeight(kappIdv0)
        }
      }

      break

    default:
      break
  }

  return nextState
}

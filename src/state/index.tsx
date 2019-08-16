import * as Automerge from 'automerge'
import * as BrowserFS from 'browserfs'
import { last, map, reduce } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { Option } from 'fp-ts/es6/Option'
import produce from 'immer'
import * as git from 'isomorphic-git'
import * as nGram from 'n-gram'
import { Dispatch } from 'react'
import { nGramRange } from '../constants'
import { findKappById } from '../kapps'
import { stringClamper } from '../kitchensink/purefns'
import { zoomInto, zoomOutToRoot } from '../navigation'
import { newHuffmanRoot } from '../navigation/huffman'
import {
  AppAction,
  AppState,
  AppSyncRoot,
  AppTempRoot,
  Kapp,
  nGrammer,
  Waypoint,
} from '../types'

const placeholderText = `Formal epistemology uses formal methods from decision theory, logic, probability theory and computability theory to model and reason about issues of epistemological interest. Work in this area spans several academic fields, including philosophy, computer science, economics, and statistics. The focus of formal epistemology has tended to differ somewhat from that of traditional epistemology, with topics like uncertainty, induction, and belief revision garnering more attention than the analysis of knowledge, skepticism, and issues with justification.`
// const placeholderText = ''

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
        await git.init({ dir: '/' })

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
  return git.commit({
    dir: '/',
    author: {
      name: 'Keykapp Syncbot',
      email: 'syncbot@keykapp.com',
    },
    message: `${messageTitle}\n\n${serializedChanges}`,
  })
}

export function makeInitialAppState(): AppState {
  const initialHuffmanRoot = newHuffmanRoot({})

  const syncRoot = null

  const tempRoot: AppTempRoot = {
    waypointBreadcrumbs: [initialHuffmanRoot],
    sequenceFrequencies: new Map(),
  }

  const initialAppState: AppState = { syncRoot, tempRoot }
  return initialAppState
}

export function makeInitialSyncRoot(): AppSyncRoot {
  return Automerge.from({
    kappIdv0Log: [],
    currentBuffer: stringClamper(280)(placeholderText),
  })
}

export async function loadSyncRootFromBrowserGit(
  state: AppState,
  dispatch: Dispatch<AppAction>
): Promise<void> {
  if (!state.syncRoot) {
    let syncRoot: AppSyncRoot | null = null
    try {
      let commits = await git.log({
        dir: '/',
      })
      console.info(`Loaded ${commits.length} commits from git log.`)

      const syncRootChanges = reduce(
        [],
        (
          allChanges: Automerge.Change[],
          commit: git.CommitDescription
        ): Automerge.Change[] => {
          const payload = commit.message
            .split('\n')
            .slice(2)
            .join('\n')

          let changes = JSON.parse(payload)
          return allChanges.concat(changes)
        }
      )(commits)

      syncRoot = Automerge.applyChanges(Automerge.init(), syncRootChanges)
    } catch (_e) {
      const initialSyncRoot = makeInitialSyncRoot()
      let initialChanges = Automerge.getChanges(
        Automerge.init(),
        initialSyncRoot
      )
      await commitChanges('initialSyncRoot', initialChanges)

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

export function logKappExecution(draftState: AppSyncRoot, kapp: Kapp): void {
  draftState.kappIdv0Log.push(kapp.idv0)
}

export function rootWaypoint(state: AppState): Waypoint {
  return head(state.tempRoot.waypointBreadcrumbs)
}

function updateSequenceFrequencies(
  draftState: AppTempRoot,
  kappLog: string[]
): void {
  const kGrammers = map((k): nGrammer => nGram(k))(nGramRange)
  draftState.sequenceFrequencies = reduce(
    new Map(),
    (
      seqFreqs: Map<string, number>,
      kGrammer: nGrammer
    ): Map<string, number> => {
      const kGrams = kGrammer(kappLog)
      kGrams.forEach((kGram: string[]): void => {
        const key = kGram.join('\n')
        const value = (seqFreqs.get(key) || 0) + 1
        seqFreqs.set(key, value)
      })
      return seqFreqs
    }
  )(kGrammers)
}

export function appReducer(prevState: AppState, action: AppAction): AppState {
  let nextSyncRoot = prevState.syncRoot
  let nextTempRoot = prevState.tempRoot

  switch (action.type) {
    case 'LoadSyncRootFromBrowserGit':
      if (!prevState.syncRoot) {
        nextSyncRoot = action.data.syncRoot
        nextTempRoot = produce(
          nextTempRoot,
          (draftState: AppTempRoot): void => {
            const kappLog = nextSyncRoot ? nextSyncRoot.kappIdv0Log : []
            updateSequenceFrequencies(draftState, kappLog)
          }
        )
      }
      break
    case 'KeyswitchUp':
      const [_keyswitch, waypoint] = action.data.keybinding
      const kappIdv0 = waypoint.value.kappIdv0
      const kapp = kappIdv0 && findKappById(kappIdv0)

      if (prevState.syncRoot && kappIdv0 && kapp) {
        nextSyncRoot = Automerge.change(
          prevState.syncRoot,
          kappIdv0,
          (draftState: AppSyncRoot): void => {
            kapp.instruction(draftState, action)

            logKappExecution(draftState, kapp)
          }
        )

        let changes = Automerge.getChanges(prevState.syncRoot, nextSyncRoot)

        commitChanges(kappIdv0, changes)
      }

      nextTempRoot = produce(nextTempRoot, (draftState: AppTempRoot): void => {
        if (!kappIdv0) {
          zoomInto(waypoint)(draftState, action)
        } else {
          // Update huffman tree based on kapp's updated weight calculated from
          // the kappLog
          draftState.waypointBreadcrumbs = [
            newHuffmanRoot({
              state: { syncRoot: nextSyncRoot, tempRoot: draftState },
            }),
          ]

          zoomOutToRoot(draftState, action)
        }
      })

      break

    default:
      break
  }

  const nextState =
    nextSyncRoot === prevState.syncRoot && nextTempRoot === prevState.tempRoot
      ? prevState
      : { syncRoot: nextSyncRoot, tempRoot: nextTempRoot }

  return nextState
}

import * as Automerge from 'automerge'
import { last } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { Option } from 'fp-ts/es6/Option'
import produce from 'immer'
import { getKappById } from '../kapps'
import { zoomInto, zoomOutToRoot } from '../navigation'
import { newHuffmanRoot } from '../navigation/huffman'
import {
  AppAction,
  AppState,
  AppSyncRoot,
  AppTempRoot,
  Kapp,
  Waypoint,
} from '../types'

export function makeInitialAppState(): AppState {
  const initialHuffmanRoot = newHuffmanRoot({})

  const initialAppState: AppState = {
    syncRoot: Automerge.from({ kappIdv0Log: [], currentBuffer: '' }),
    tempRoot: { waypointBreadcrumbs: [initialHuffmanRoot] },
  }
  return initialAppState
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

export function appReducer(prevState: AppState, action: AppAction): AppState {
  const nextSyncRoot = Automerge.change(
    prevState.syncRoot,
    (draftState: AppSyncRoot): void => {
      const [_keyswitch, waypoint] = action.data.keybinding

      const kappIdv0 = waypoint.value.kappIdv0
      if (kappIdv0) {
        const kapp = getKappById(kappIdv0)

        if (kapp) {
          kapp.instruction(draftState, action)

          logKappExecution(draftState, kapp)
        } else {
          throw new Error('Could not find kapp from id given.')
        }
      }
    }
  )

  const nextTempRoot = produce(
    prevState.tempRoot,
    (draftState: AppTempRoot): void => {
      const [_keyswitch, waypoint] = action.data.keybinding

      const kappIdv0 = waypoint.value.kappIdv0
      if (!kappIdv0) {
        zoomInto(waypoint)(draftState, action)
      } else {
        const kapp = getKappById(kappIdv0)

        if (kapp) {
          // kapp.instruction(draftState, action)

          // logKappExecution(draftState, kapp)

          // Update huffman tree based on kapp's updated weight calculated from
          // the kappLog
          draftState.waypointBreadcrumbs = [
            newHuffmanRoot({ state: prevState }),
          ]

          zoomOutToRoot(draftState, action)
        } else {
          throw new Error('Could not find kapp from id given.')
        }
      }
    }
  )

  const nextState =
    nextSyncRoot === prevState.syncRoot && nextTempRoot === prevState.tempRoot
      ? prevState
      : { syncRoot: nextSyncRoot, tempRoot: nextTempRoot }

  return nextState
}

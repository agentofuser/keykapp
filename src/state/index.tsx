import * as Automerge from 'automerge'
import { foldMap, getMonoid, last } from 'fp-ts/es6/Array'
import { fold, fromNullable, none, Option } from 'fp-ts/es6/Option'
import { getKappById } from '../kapps'
import { newHuffmanRoot } from '../navigation/huffman'
import {
  AppAction,
  AppReducer,
  AppState,
  Kapp,
  SyncRoot,
  Waypoint,
  WaypointUuid,
} from '../types'

export const logAction: AppReducer = (prevState, action): AppState => {
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.appActionLog.push(action)
  })

  return nextState
}

export function getWaypointByUuid(
  state: AppState,
  waypointUuid: WaypointUuid
): Waypoint {
  const waypoint = Automerge.getObjectById(state, waypointUuid)

  if (!waypoint) {
    throw new Error('Keybinding refers to unavailable waypoint')
  }

  return waypoint
}

export function kappLog(state: SyncRoot): Kapp[] {
  const M = getMonoid<Kapp>()
  const log = foldMap(M)((appAction: AppAction): Kapp[] => {
    const waypoint = getWaypointByUuid(state, appAction.data.keybinding[1])
    const id = waypoint.value.kappIdv0
    if (id) {
      return [getKappById(id)]
    } else {
      return []
    }
  })(state.appActionLog)

  return log
}

export function makeInitialAppState(): AppState {
  const userLog: AppAction[] = []
  const initialHuffmanRoot = newHuffmanRoot({})
  // Use a tmp to get an UUID for the rootWaypoint first and then use
  // it in waypointBreadcrumbs
  const tmpInitialAppState: AppState = Automerge.from(
    {
      appActionLog: userLog,
      currentBuffer: '',
      rootWaypoint: initialHuffmanRoot,
      waypointBreadcrumbs: [],
    },
    { freeze: false }
  )
  const initialAppState = Automerge.change(
    tmpInitialAppState,
    (doc: SyncRoot): void => {
      const rootWaypointUuid = Automerge.getObjectId(doc.rootWaypoint)
      doc.waypointBreadcrumbs = [rootWaypointUuid]
    }
  )
  return initialAppState
}

export function currentWaypoint(state: AppState): Option<Waypoint> {
  const waypointUuidOption = last(state.waypointBreadcrumbs)
  const waypoint = fold(
    (): Option<Waypoint> => none,
    (waypointUuid: Automerge.UUID): Option<Waypoint> =>
      fromNullable(Automerge.getObjectById(state, waypointUuid))
  )(waypointUuidOption)
  return waypoint
}

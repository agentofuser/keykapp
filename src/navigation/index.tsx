import * as Automerge from 'automerge'
import { isNonEmpty } from 'fp-ts/es6/Array'
import { AppAction, AppReducer, AppState, SyncRoot, Waypoint } from '../types'

export function zoomInto(waypoint: Waypoint): AppReducer {
  return function navigateReducer(
    prevState: AppState,
    _action: AppAction
  ): AppState {
    if (isNonEmpty(waypoint.forest)) {
      return Automerge.change(prevState, (doc: SyncRoot): void => {
        doc.waypointBreadcrumbs.push(Automerge.getObjectId(waypoint))
      })
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(
  prevState: AppState,
  _action: AppAction
): AppState {
  return Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.waypointBreadcrumbs = [Automerge.getObjectId(doc.rootWaypoint)]
  })
}

export function zoomOutToParent(
  prevState: AppState,
  _action: AppAction
): AppState {
  // return { ...prevState, currentWaypoint: prevState.currentWaypoint.value.parent }
  const nextState = Automerge.change(prevState, (doc: SyncRoot): void => {
    doc.waypointBreadcrumbs.pop()
  })
  return nextState
}

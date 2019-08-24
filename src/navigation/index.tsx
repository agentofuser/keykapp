import { isNonEmpty } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { AppAction, AppState, DraftAppStateMutator, Waypoint } from '../types'

export function zoomInto(waypoint: Waypoint): DraftAppStateMutator {
  return function navigateReducer(
    draftState: AppState,
    _action: AppAction
  ): void {
    if (isNonEmpty(waypoint.forest)) {
      draftState.tempRoot.waypointBreadcrumbs.push(waypoint)
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(draftState: AppState, _action: AppAction): void {
  draftState.tempRoot.waypointBreadcrumbs = [
    head(draftState.tempRoot.waypointBreadcrumbs),
  ]
}

export function zoomOutToParent(
  draftState: AppState,
  _action: AppAction
): void {
  if (draftState.tempRoot.waypointBreadcrumbs.length > 1) {
    draftState.tempRoot.waypointBreadcrumbs.pop()
  }
}

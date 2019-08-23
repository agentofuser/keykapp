import { isNonEmpty } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import produce from 'immer'
import {
  AppAction,
  AppState,
  AppTempRoot,
  DraftAppStateMutator,
  Waypoint,
} from '../types'

export function zoomInto(waypoint: Waypoint): DraftAppStateMutator {
  return function navigateReducer(
    draftState: AppState,
    _action: AppAction
  ): void {
    if (isNonEmpty(waypoint.forest)) {
      draftState.tempRoot = produce(
        draftState.tempRoot,
        (draftTempRoot: AppTempRoot): void => {
          draftTempRoot.waypointBreadcrumbs.push(waypoint)
        }
      )
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(draftState: AppState, _action: AppAction): void {
  draftState.tempRoot = produce(
    draftState.tempRoot,
    (draftTempRoot: AppTempRoot): void => {
      draftTempRoot.waypointBreadcrumbs = [
        head(draftTempRoot.waypointBreadcrumbs),
      ]
    }
  )
}

export function zoomOutToParent(
  draftState: AppState,
  _action: AppAction
): void {
  if (draftState.tempRoot.waypointBreadcrumbs.length > 1) {
    draftState.tempRoot = produce(
      draftState.tempRoot,
      (draftTempRoot: AppTempRoot): void => {
        draftTempRoot.waypointBreadcrumbs.pop()
      }
    )
  }
}

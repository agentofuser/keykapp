import { isNonEmpty } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import {
  AppAction,
  AppTempRoot,
  DraftTempRootMutator,
  Waypoint,
} from '../types'

export function zoomInto(waypoint: Waypoint): DraftTempRootMutator {
  return function navigateReducer(
    draftState: AppTempRoot,
    _action: AppAction
  ): void {
    if (isNonEmpty(waypoint.forest)) {
      draftState.waypointBreadcrumbs.push(waypoint)
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(
  draftState: AppTempRoot,
  _action: AppAction
): void {
  draftState.waypointBreadcrumbs = [head(draftState.waypointBreadcrumbs)]
}

export function zoomOutToParent(
  draftState: AppTempRoot,
  _action: AppAction
): void {
  draftState.waypointBreadcrumbs.pop()
}

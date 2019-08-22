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
    draftTempRoot: AppTempRoot,
    _action: AppAction
  ): void {
    if (isNonEmpty(waypoint.forest)) {
      draftTempRoot.waypointBreadcrumbs.push(waypoint)
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(
  draftTempRoot: AppTempRoot,
  _action: AppAction
): void {
  draftTempRoot.waypointBreadcrumbs = [head(draftTempRoot.waypointBreadcrumbs)]
}

export function zoomOutToParent(
  draftTempRoot: AppTempRoot,
  _action: AppAction
): void {
  if (draftTempRoot.waypointBreadcrumbs.length > 1) {
    draftTempRoot.waypointBreadcrumbs.pop()
  }
}

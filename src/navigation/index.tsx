import { isNonEmpty } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { AppAction, AppState, DraftAppStateMutator, Menu } from '../types'

export function menuIn(menu: Menu): DraftAppStateMutator {
  return function navigateReducer(
    draftState: AppState,
    _action: AppAction
  ): void {
    if (isNonEmpty(menu.forest)) {
      draftState.tempRoot.waypointBreadcrumbs.push(menu)
      draftState.tempRoot.menuIns.push(menu)
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function menuOutToRoot(draftState: AppState, _action: AppAction): void {
  draftState.tempRoot.waypointBreadcrumbs = [
    head(draftState.tempRoot.waypointBreadcrumbs),
  ]
  draftState.tempRoot.menuIns = []
}

export function menuOut(draftState: AppState, _action: AppAction): void {
  if (draftState.tempRoot.waypointBreadcrumbs.length > 1) {
    draftState.tempRoot.waypointBreadcrumbs.pop()
  }
}

import { isNonEmpty } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { listModeKapps, textModeKapps } from '../kapps'
import { currentMode } from '../state'
import { AppAction, AppState, DraftAppStateMutator, Menu } from '../types'
import { newHuffmanRoot } from './huffman'

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

export function recomputeMenuRoot(draftState: AppState): void {
  const mode = draftState.syncRoot
    ? currentMode(draftState.syncRoot)
    : 'text-mode'
  // Update huffman tree based on kapp's updated weight calculated
  // from the kappLog
  draftState.tempRoot.waypointBreadcrumbs = [
    newHuffmanRoot({
      state: draftState,
      kapps: mode === 'list-mode' ? listModeKapps : textModeKapps,
    }),
  ]
}

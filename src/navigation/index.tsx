import { isNonEmpty } from 'fp-ts/es6/Array'
import { head } from 'fp-ts/es6/NonEmptyArray'
import { listModeKapps, textModeKapps } from '../kapps'
import { currentMode } from '../state'
import { AppAction, AppState, DraftAppStateMutator, Keybinding } from '../types'
import { newHuffmanRoot } from './huffman'
import { spacebarKeyswitch } from '../constants'

export function menuIn(keybinding: Keybinding): DraftAppStateMutator {
  return function navigateReducer(
    draftState: AppState,
    _action: AppAction
  ): AppState {
    const [_keyswitch, menu] = keybinding
    if (isNonEmpty(menu.forest)) {
      draftState.tempRoot.keybindingBreadcrumbs.push(keybinding)
      draftState.tempRoot.menuIns.push(menu)
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
    return draftState
  }
}

export function menuOutToRoot(draftState: AppState, _action: AppAction): void {
  draftState.tempRoot.keybindingBreadcrumbs = [
    head(draftState.tempRoot.keybindingBreadcrumbs),
  ]
  draftState.tempRoot.menuIns = []
}

export function menuOut(draftState: AppState, _action: AppAction): AppState {
  if (draftState.tempRoot.keybindingBreadcrumbs.length > 1) {
    draftState.tempRoot.keybindingBreadcrumbs.pop()
  }
  return draftState
}

export function recomputeMenuRoot(draftState: AppState): void {
  const mode = draftState.syncRoot
    ? currentMode(draftState.syncRoot)
    : 'text-mode'
  // Update huffman tree based on kapp's updated weight calculated
  // from the kappLog
  draftState.tempRoot.keybindingBreadcrumbs = [[
    spacebarKeyswitch,
    newHuffmanRoot({
      state: draftState,
      kapps: mode === 'list-mode' ? listModeKapps : textModeKapps,
    }),
  ]]
}

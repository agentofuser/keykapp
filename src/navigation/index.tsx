import { isNonEmpty } from 'fp-ts/es6/Array'
import { AppAction, AppReducer, AppState, Waypoint } from '../types'

export function zoomInto(waypoint: Waypoint): AppReducer {
  return function navigateReducer(
    prevState: AppState,
    _action: AppAction
  ): AppState {
    if (isNonEmpty(waypoint.forest)) {
      return { ...prevState, currentWaypoint: waypoint }
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(
  prevState: AppState,
  _action: AppAction
): AppState {
  return { ...prevState, currentWaypoint: prevState.rootWaypoint }
}

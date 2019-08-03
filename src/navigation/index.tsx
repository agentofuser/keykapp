import { isNonEmpty } from 'fp-ts/es6/Array'
import { fold } from 'fp-ts/es6/Option'
import { AppAction, AppReducer, AppState, Waypoint } from '../types'
import {
  fromArray,
  tail,
  NonEmptyArray,
  of,
  cons,
} from 'fp-ts/es6/NonEmptyArray'

export function zoomInto(waypoint: Waypoint): AppReducer {
  return function navigateReducer(
    prevState: AppState,
    _action: AppAction
  ): AppState {
    if (isNonEmpty(waypoint.forest)) {
      return {
        ...prevState,
        waypointBreadcrumbs: cons(waypoint, prevState.waypointBreadcrumbs),
      }
    } else {
      throw new Error('Cannot navigate to leaf waypoint')
    }
  }
}

export function zoomOutToRoot(
  prevState: AppState,
  _action: AppAction
): AppState {
  return {
    ...prevState,
    waypointBreadcrumbs: of(prevState.rootWaypoint),
  }
}

export function zoomOutToParent(
  prevState: AppState,
  _action: AppAction
): AppState {
  // return { ...prevState, currentWaypoint: prevState.currentWaypoint.value.parent }
  const nextState = fold(
    (): AppState => prevState,
    (tailBreadcrumbs: NonEmptyArray<Waypoint>): AppState => ({
      ...prevState,
      waypointBreadcrumbs: tailBreadcrumbs,
    })
  )(fromArray(tail(prevState.waypointBreadcrumbs)))
  return nextState
}

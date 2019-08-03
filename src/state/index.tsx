import { foldMap, getMonoid } from 'fp-ts/es6/Array'
import { cons } from 'fp-ts/es6/NonEmptyArray'
import { AppAction, AppReducer, AppState, Kapp } from '../types'
import { getKappById } from '../kapps'

export const logAction: AppReducer = (prevState, action): AppState => {
  const nextState = {
    ...prevState,
    appActionLog: cons(action, prevState.appActionLog),
  }

  return nextState
}

export function kappLog(appActionLog: AppAction[]): Kapp[] {
  const M = getMonoid<Kapp>()
  const log = foldMap(M)((appAction: AppAction): Kapp[] => {
    const waypoint = appAction.data.keybinding[1]
    const id = waypoint.value.kappIdv0
    if (id) {
      return [getKappById(id)]
    } else {
      return []
    }
  })(appActionLog)

  return log
}

export function serializeAppState(appState: AppState): string {
  function setToJson(_key: any, value: any): any {
    if (typeof value === 'object' && value instanceof Set) {
      return [...value]
    }
    return value
  }
  return JSON.stringify(appState, setToJson, 2)
}

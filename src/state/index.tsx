import { AppState, AppReducer, Kapp, AppAction } from '../types'
import { cons } from 'fp-ts/es6/NonEmptyArray'
import { getMonoid, foldMap } from 'fp-ts/es6/Array'
import { fold } from 'fp-ts/es6/Option'

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
    const kappOption = appAction.data.keybinding[1].value.kapp
    const kapps = fold((): Kapp[] => [], (kapp: Kapp): Kapp[] => [kapp])(
      kappOption
    )
    return kapps
  })(appActionLog)

  return log
}

import { AppState, AppReducer } from '../types'
import { cons } from 'fp-ts/es6/NonEmptyArray'

export const logAction: AppReducer = (prevState, action): AppState => {
  const nextState = {
    ...prevState,
    appActionLog: cons(action, prevState.appActionLog),
  }

  return nextState
}

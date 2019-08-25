import * as Automerge from 'automerge'
import { idv0UserlandPrefix } from '../constants'
import { currentSexpList } from '../state'
import { AppAction, AppSyncRoot, Sexp, UserlandKapp } from '../types'

function textNew(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list: Automerge.List<Sexp> = currentSexpList(draftSyncRoot)
  let cursorIdx = draftSyncRoot.currentSexpCursorIdx

  if (list.insertAt) list.insertAt(cursorIdx, new Automerge.Text(''))
  draftSyncRoot.currentSexpCursorIdx = cursorIdx + 1
}

function zoomNext(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = currentSexpList(draftSyncRoot)
  let cursorIdx = draftSyncRoot.currentSexpCursorIdx

  if (cursorIdx < list.length) {
    draftSyncRoot.currentSexpCursorIdx = cursorIdx + 1
  }
}

function zoomPrev(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  let cursorIdx = draftSyncRoot.currentSexpCursorIdx

  if (cursorIdx > 1) {
    draftSyncRoot.currentSexpCursorIdx = cursorIdx - 1
  }
}

export const sexpKapps: UserlandKapp[] = [
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}text/new`,
    shortAsciiName: ':text-new',
    legend: '📝:text-new',
    instruction: textNew,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}zoom/next`,
    shortAsciiName: ':zoom-next',
    legend: '⬇️:zoom-next',
    instruction: zoomNext,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}zoom/prev`,
    shortAsciiName: ':zoom-prev',
    legend: '⬆️:zoom-prev',
    instruction: zoomPrev,
  },
]

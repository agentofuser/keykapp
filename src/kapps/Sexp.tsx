import * as Automerge from 'automerge'
import { idv0UserlandPrefix } from '../constants'
import { currentSexpList, setFocusCursorIdx } from '../state'
import { AppAction, AppSyncRoot, Sexp, UserlandKapp } from '../types'

function textNew(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list: Automerge.List<Sexp> = currentSexpList(draftSyncRoot)
  let cursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (list.insertAt) list.insertAt(cursorIdx, new Automerge.Text(''))
  draftSyncRoot.sexpZoomCursorIdx = cursorIdx + 1
  setFocusCursorIdx(draftSyncRoot, list, draftSyncRoot.sexpZoomCursorIdx)
}

function zoomNext(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = currentSexpList(draftSyncRoot)
  let zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (zoomCursorIdx < list.length) {
    draftSyncRoot.sexpZoomCursorIdx = zoomCursorIdx + 1
    setFocusCursorIdx(draftSyncRoot, list, draftSyncRoot.sexpZoomCursorIdx)
  }
}

function zoomPrev(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = currentSexpList(draftSyncRoot)
  let zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (zoomCursorIdx > 1) {
    draftSyncRoot.sexpZoomCursorIdx = zoomCursorIdx - 1
    setFocusCursorIdx(draftSyncRoot, list, draftSyncRoot.sexpZoomCursorIdx)
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

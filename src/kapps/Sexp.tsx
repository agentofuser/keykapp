import * as Automerge from 'automerge'
import { idv0UserlandPrefix } from '../constants'
import {
  getCurrentFocusCursorIdx,
  lastListInZoomPath,
  parentList,
  setFocusCursorIdx,
  zoomedList,
  zoomLevel,
} from '../state'
import { AppAction, AppSyncRoot, Sexp, UserlandKapp } from '../types'

function textNew(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list: Automerge.List<Sexp> = lastListInZoomPath(draftSyncRoot)
  let zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx
  let zoomLevel = zoomCursorIdx > 0 ? 'atom' : 'list'

  if (zoomLevel === 'list') {
    const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
    if (list.insertAt) {
      list.insertAt(focusCursorIdx, new Automerge.Text(''))
      setFocusCursorIdx(draftSyncRoot, list, focusCursorIdx + 1)
    }
  } else if (zoomLevel === 'atom') {
    if (list.insertAt) {
      list.insertAt(zoomCursorIdx, new Automerge.Text(''))
      draftSyncRoot.sexpZoomCursorIdx = zoomCursorIdx + 1
      setFocusCursorIdx(draftSyncRoot, list, draftSyncRoot.sexpZoomCursorIdx)
    }
  }
}

function sexpDelete(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = zoomedList(draftSyncRoot)
  if (list) {
    const idx = getCurrentFocusCursorIdx(draftSyncRoot) - 1
    if (list.deleteAt) {
      list.deleteAt(idx)
      setFocusCursorIdx(draftSyncRoot, list, idx)
    }
  }
}

function focusNext(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  if (zoomLevel(draftSyncRoot) === 'atom') return
  const list = lastListInZoomPath(draftSyncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
  if (focusCursorIdx < list.length) {
    setFocusCursorIdx(draftSyncRoot, list, focusCursorIdx + 1)
  }
}

function focusPrev(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  if (zoomLevel(draftSyncRoot) === 'atom') return
  const list = lastListInZoomPath(draftSyncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
  if (focusCursorIdx > 0) {
    setFocusCursorIdx(draftSyncRoot, list, focusCursorIdx - 1)
  }
}

function zoomNext(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const parent = parentList(draftSyncRoot)
  if (!parent) return

  let zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (zoomCursorIdx < parent.length) {
    draftSyncRoot.sexpZoomCursorIdx = zoomCursorIdx + 1
    setFocusCursorIdx(draftSyncRoot, parent, draftSyncRoot.sexpZoomCursorIdx)
  }
}

function zoomPrev(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const parent = parentList(draftSyncRoot)
  if (!parent) return

  let zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (zoomCursorIdx > 1) {
    draftSyncRoot.sexpZoomCursorIdx = zoomCursorIdx - 1
    setFocusCursorIdx(draftSyncRoot, parent, draftSyncRoot.sexpZoomCursorIdx)
  }
}

function zoomIn(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  if (zoomLevel(draftSyncRoot) === 'atom') return

  const parent = parentList(draftSyncRoot)
  const currentListIdx = draftSyncRoot.sexpZoomCursorIdx - 1
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)

  if (focusCursorIdx > 0) {
    if (parent) draftSyncRoot.sexpListZoomPath.push(currentListIdx)
    draftSyncRoot.sexpZoomCursorIdx = focusCursorIdx
  }
}

function zoomOut(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  let zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (zoomCursorIdx > 0) {
    draftSyncRoot.sexpZoomCursorIdx = 0
  } else {
    draftSyncRoot.sexpListZoomPath.pop()
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
    idv0: `${idv0UserlandPrefix}sexp/delete`,
    shortAsciiName: ':delete',
    legend: '🗑:delete',
    instruction: sexpDelete,
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
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}zoom/in`,
    shortAsciiName: ':zoom-in',
    legend: '🔬:zoom-in',
    instruction: zoomIn,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}zoom/out`,
    shortAsciiName: ':zoom-out',
    legend: '👋:zoom-out',
    instruction: zoomOut,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}focus/next`,
    shortAsciiName: ':focus-next',
    legend: '⬇️:focus-next',
    instruction: focusNext,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}focus/prev`,
    shortAsciiName: ':focus-prev',
    legend: '⬆️:focus-prev',
    instruction: focusPrev,
  },
]

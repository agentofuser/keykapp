import { idv0UserlandPrefix } from '../constants'
import {
  focusedSexp,
  getCurrentFocusCursorIdx,
  lastListInZoomPath,
  setFocusCursorIdx,
  zoomedList,
  zoomedSexp,
} from '../state'
import {
  AppAction,
  AppSyncRoot,
  SexpNode,
  SexpList,
  UserlandKapp,
  SexpText as SexpText,
} from '../types'
import { v4 as uuidv4 } from 'uuid'

export const Sexp = {
  List: {
    from: (xs: Array<SexpNode>): SexpList => ({
      uuid: uuidv4(),
      children: [],
    }),
  },
  isList: (sexp: SexpNode): sexp is SexpList => {
    return (sexp as SexpList).children !== undefined
  },
  isText: (sexp: SexpNode): sexp is SexpText => {
    return (sexp as SexpText).value !== undefined
  },
}

function textNew(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list: Automerge.List<SexpNode> = lastListInZoomPath(draftSyncRoot)
  const zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx
  const zoomLevel = zoomCursorIdx > 0 ? 'atom' : 'list'

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

function listNew(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = zoomedList(draftSyncRoot)
  if (list) {
    const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
    if (list.insertAt) {
      list.insertAt(focusCursorIdx, [])
      setFocusCursorIdx(draftSyncRoot, list, focusCursorIdx + 1)
    }
  }
}

function focusedDelete(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const sexp = zoomedSexp(draftSyncRoot)
  if (sexp) {
    const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
    const idx = focusCursorIdx - 1
    if (sexp.deleteAt && focusCursorIdx > 0 && focusCursorIdx <= sexp.length) {
      const deleted = sexp[idx]
      sexp.deleteAt(idx)
      if (!(sexp instanceof Automerge.Text)) {
        setFocusCursorIdx(draftSyncRoot, deleted, undefined)
      }
      setFocusCursorIdx(draftSyncRoot, sexp, idx)
    }
  }
}

function moveBack(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = zoomedList(draftSyncRoot)
  if (list) {
    const idx = getCurrentFocusCursorIdx(draftSyncRoot) - 1
    if (idx > 0) {
      const newIdx = idx - 1
      const newFocusCursorIdx = newIdx + 1
      const sexp = list[idx]
      if (list.deleteAt && list.insertAt) {
        list.deleteAt(idx)
        list.insertAt(newIdx, sexp)
        setFocusCursorIdx(draftSyncRoot, list, newFocusCursorIdx)
      }
    }
  }
}

function moveForth(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = zoomedList(draftSyncRoot)
  if (list) {
    const idx = getCurrentFocusCursorIdx(draftSyncRoot) - 1
    if (idx < list.length - 1) {
      const newIdx = idx + 1
      const newFocusCursorIdx = newIdx + 1
      const sexp = list[idx]
      if (list.deleteAt && list.insertAt) {
        list.deleteAt(idx)
        list.insertAt(newIdx, sexp)
        setFocusCursorIdx(draftSyncRoot, list, newFocusCursorIdx)
      }
    }
  }
}

function focusNext(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const sexp = zoomedSexp(draftSyncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
  if (focusCursorIdx < sexp.length) {
    setFocusCursorIdx(draftSyncRoot, sexp, focusCursorIdx + 1)
  }
}

function focusPrev(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const sexp = zoomedSexp(draftSyncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
  if (focusCursorIdx > 0) {
    setFocusCursorIdx(draftSyncRoot, sexp, focusCursorIdx - 1)
  }
}

function focusFirst(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const sexp = zoomedSexp(draftSyncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
  if (focusCursorIdx > 0) {
    setFocusCursorIdx(draftSyncRoot, sexp, 1)
  }
}

function focusLast(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const sexp = zoomedSexp(draftSyncRoot)
  const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
  if (focusCursorIdx < sexp.length) {
    setFocusCursorIdx(draftSyncRoot, sexp, sexp.length)
  }
}

function zoomIn(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const sexp = focusedSexp(draftSyncRoot)
  if (sexp) {
    const focusCursorIdx = getCurrentFocusCursorIdx(draftSyncRoot)
    if (sexp instanceof Automerge.Text) {
      draftSyncRoot.sexpZoomCursorIdx = focusCursorIdx
    } else {
      draftSyncRoot.sexpListZoomPath.push(focusCursorIdx - 1)
      draftSyncRoot.sexpZoomCursorIdx = 0
    }
  }
}

function zoomOut(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const zoomCursorIdx = draftSyncRoot.sexpZoomCursorIdx

  if (zoomCursorIdx > 0) {
    draftSyncRoot.sexpZoomCursorIdx = 0
  } else {
    draftSyncRoot.sexpListZoomPath.pop()
  }
}

export const zoomedListOnlyKapps: UserlandKapp[] = [
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}text/new`,
    shortAsciiName: ':text-new',
    legend: '📝:text-new',
    instruction: textNew,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}list/new`,
    shortAsciiName: ':list-new',
    legend: '📃:list-new',
    instruction: listNew,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}sexp/move-back`,
    shortAsciiName: ':move-back',
    legend: '🌤:move-back',
    instruction: moveBack,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}sexp/move-forth`,
    shortAsciiName: ':move-forth',
    legend: '☀️:move-forth',
    instruction: moveForth,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}zoom/in`,
    shortAsciiName: ':zoom-in',
    legend: '🔬:zoom-in',
    instruction: zoomIn,
  },
]

export const zoomOutKapp: UserlandKapp = {
  type: 'UserlandKapp',
  idv0: `${idv0UserlandPrefix}zoom/out`,
  shortAsciiName: ':zoom-out',
  legend: '👋:zoom-out',
  instruction: zoomOut,
}

export const deleteKapp: UserlandKapp = {
  type: 'UserlandKapp',
  idv0: `${idv0UserlandPrefix}sexp/delete`,
  shortAsciiName: ':delete',
  legend: '🗑:delete',
  instruction: focusedDelete,
}

export const zoomedListOrTextKapps: UserlandKapp[] = [
  deleteKapp,
  zoomOutKapp,
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
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}focus/first`,
    shortAsciiName: ':focus-first',
    legend: '⬆️:focus-first',
    instruction: focusFirst,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}focus/last`,
    shortAsciiName: ':focus-last',
    legend: '⬇️:focus-last',
    instruction: focusLast,
  },
]

export const sexpKapps: UserlandKapp[] = [
  ...zoomedListOnlyKapps,
  ...zoomedListOrTextKapps,
]

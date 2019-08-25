import * as Automerge from 'automerge'
import { idv0UserlandPrefix } from '../constants'
import { AppSyncRoot, UserlandKapp, SexpItem } from '../types'
import { AppAction } from '../types'
import { currentSexpList } from '../state'
import { isEmpty } from 'fp-ts/es6/Array'

function textNew(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list: Automerge.List<SexpItem> = currentSexpList(draftSyncRoot)
  let idx
  if (isEmpty(list)) {
    idx = 0
  } else if (draftSyncRoot.currentSexpAtomIndx !== null) {
    idx = draftSyncRoot.currentSexpAtomIndx + 1
  } else {
    idx = list.length
  }

  if (list.insertAt) list.insertAt(idx, new Automerge.Text(''))
  draftSyncRoot.currentSexpAtomIndx = idx
}

function listNext(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = currentSexpList(draftSyncRoot)
  let idx = draftSyncRoot.currentSexpAtomIndx
  if (isEmpty(list)) {
    idx = null
  } else if (idx !== null) {
    idx = idx + 1
  } else {
    idx = list.length - 1
  }

  if (idx !== null && idx >= 0 && idx < list.length) {
    draftSyncRoot.currentSexpAtomIndx = idx
  }
}

function listPrev(draftSyncRoot: AppSyncRoot, _action: AppAction): void {
  const list = currentSexpList(draftSyncRoot)
  let idx = draftSyncRoot.currentSexpAtomIndx
  if (isEmpty(list)) {
    idx = null
  } else if (idx !== null) {
    idx = idx - 1
  } else {
    idx = 0
  }

  if (idx !== null && idx >= 0 && idx < list.length) {
    draftSyncRoot.currentSexpAtomIndx = idx
  }
}

export const sexpListKapps: UserlandKapp[] = [
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}text/new`,
    shortAsciiName: ':text-new',
    legend: '📝:text-new',
    instruction: textNew,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}list/next`,
    shortAsciiName: ':list-next',
    legend: '⬇️:list-next',
    instruction: listNext,
  },
  {
    type: 'UserlandKapp',
    idv0: `${idv0UserlandPrefix}list/prev`,
    shortAsciiName: ':list-prev',
    legend: '⬆️:list-prev',
    instruction: listPrev,
  },
]

import * as Automerge from 'automerge'
import * as React from 'react'
import { SexpNode, AppState } from '../types'
import SexpAtomStringComponent from './SexpAtomString'
import SexpListComponent from './SexpList'

export default function SexpComponent({
  state,
  sexp,
}: {
  state: AppState
  sexp: SexpNode
}): React.ReactElement {
  if (sexp instanceof Automerge.Text) {
    return <SexpAtomStringComponent state={state} text={sexp} />
  } else if (sexp instanceof Array) {
    return <SexpListComponent state={state} list={sexp} />
  } else {
    return <p>Unexpected sexp type.</p>
  }
}

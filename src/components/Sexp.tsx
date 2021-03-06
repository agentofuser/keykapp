import * as Automerge from 'automerge'
import * as React from 'react'
import { Sexp, AppState } from '../types'
import SexpTextAtomComponent from './SexpTextAtom'
import SexpListComponent from './SexpList'

export default function SexpComponent({
  state,
  sexp,
}: {
  state: AppState
  sexp: Sexp
}): React.ReactElement {
  if (sexp instanceof Automerge.Text) {
    return <SexpTextAtomComponent state={state} text={sexp} />
  } else if (sexp instanceof Array) {
    return <SexpListComponent state={state} list={sexp} />
  } else {
    return <p>Unexpected sexp type.</p>
  }
}

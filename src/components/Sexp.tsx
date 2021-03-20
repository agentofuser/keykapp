import * as React from 'react'
import { SexpNode, AppState } from '../types'
import SexpTextComponent from './SexpTextComponent'
import SexpListComponent from './SexpListComponent'
import { Sexp } from '../kapps/Sexp'

export default function SexpComponent({
  state,
  sexp,
}: {
  state: AppState
  sexp: SexpNode
}): React.ReactElement {
  if (Sexp.isText(sexp)) {
    return <SexpTextComponent state={state} text={sexp} />
  } else if (Sexp.isList(sexp)) {
    return <SexpListComponent state={state} list={sexp} />
  } else {
    return <p>Unexpected sexp type.</p>
  }
}

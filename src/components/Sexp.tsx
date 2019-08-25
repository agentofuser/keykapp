import * as Automerge from 'automerge'
import * as React from 'react'
import { Sexp } from '../types'
import SexpTextAtomComponent from './SexpTextAtom'

export default function SexpComponent({
  sexp,
}: {
  sexp: Sexp
}): React.ReactElement {
  if (sexp instanceof Automerge.Text) {
    return <SexpTextAtomComponent text={sexp} />
  } else if (sexp instanceof Automerge.List) {
    return <p>TODO</p>
  } else {
    return <p>Unexpected sexp type.</p>
  }
}

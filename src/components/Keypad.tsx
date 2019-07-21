import { makeStyles } from '@material-ui/styles'
import { map } from 'fp-ts/es6/Array'
import * as React from 'react'
import { AppAction, Keybinding, Layout } from '../types'
import Button from './Button'

const useStyles = makeStyles({
  keypad: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridColumnGap: '16px',
    margin: '0 32px',
  },
})

interface KeypadProps {
  dispatch: React.Dispatch<AppAction>
  layout: Layout
}

export default function Keypad({
  dispatch,
  layout,
}: KeypadProps): React.ReactElement {
  const classes = useStyles()

  const keybindings = map(
    (keybinding: Keybinding): React.ReactElement => (
      <Button
        dispatch={dispatch}
        keybinding={keybinding}
        key={`react-collection-key-${keybinding[0].key}`}
      ></Button>
    )
  )(Array.from(layout.entries()))

  return <div className={classes.keypad}>{keybindings}</div>
}

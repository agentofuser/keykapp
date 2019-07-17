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
    ([keyswitch, command]: Keybinding): React.ReactElement => (
      <Button
        dispatch={dispatch}
        keyswitch={keyswitch}
        command={command}
        key={`react-collection-key-${keyswitch.key}`}
      ></Button>
    )
  )(Array.from(layout.entries()))
  console.log({ keybindings })

  return <div className={classes.keypad}>{keybindings}</div>
}

import { Paper, Theme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import * as Automerge from 'automerge'
import * as React from 'react'
import { AppState } from '../types'
import { getCurrentFocusCursorIdx } from '../state'
import { splitAt } from 'fp-ts/es6/Array'

const useStyles = makeStyles((theme: Theme) => ({
  outputBuffer: {
    height: '100%',
    overflow: 'auto',
    padding: theme.spacing(0, 1),
  },
  outputBufferPre: {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
}))

function VerticalCharCursor(): React.ReactElement {
  return (
    <span
      style={{
        border: '1px solid fuchsia',
        borderTop: 'none',
        borderBottom: 'none',
        borderRight: 'none',
      }}
    >
      {' '}
    </span>
  )
}

function DirectedCharCursor({ char }: { char: string }): React.ReactElement {
  return (
    <span style={{ border: '1px solid fuchsia', borderLeft: 'none' }}>
      {char}
    </span>
  )
}

export interface SexpTextAtomComponentProps {
  state: AppState
  text: Automerge.Text
}

export default function SexpTextAtomComponent({
  state,
  text,
}: SexpTextAtomComponentProps): React.ReactElement {
  const classes = useStyles()

  let textWithCursor: React.ReactNode = 'Loading...'
  if (state.syncRoot) {
    const focusCursorIdx = getCurrentFocusCursorIdx(state.syncRoot)
    const [beforeCursor, afterCursor] = splitAt(focusCursorIdx)(text)

    const lastChar = text.join('').slice(-1)

    textWithCursor = ((): React.ReactNode => {
      switch (lastChar) {
        case '\n':
          return (
            <React.Fragment>
              {text.join('')}
              <VerticalCharCursor />
            </React.Fragment>
          )
        case '':
          return <VerticalCharCursor />
        default:
          return (
            <React.Fragment>
              {beforeCursor.slice(0, -1).join('')}
              <DirectedCharCursor char={beforeCursor.join('').slice(-1)} />
              {afterCursor.join('')}
            </React.Fragment>
          )
      }
    })()
  }

  return (
    <Paper className={classes.outputBuffer}>
      <pre className={classes.outputBufferPre}>{textWithCursor}</pre>
    </Paper>
  )
}

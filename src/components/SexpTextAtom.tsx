import { Paper, Theme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import * as Automerge from 'automerge'
import { splitAt } from 'fp-ts/es6/Array'
import * as React from 'react'
import { wordCount } from '../kitchensink/purefns'
import { getCurrentFocusCursorIdx } from '../state'
import { AppState } from '../types'

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

function stats(text: Automerge.Text): React.ReactNode {
  const string = text.join('')
  return `bytes: ${new Blob([string]).size}, words: ${wordCount(
    string
  )}\n---\n`
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
              {stats(text)}
              {text.join('')}
              <VerticalCharCursor />
            </React.Fragment>
          )
        case '':
          return (
            <React.Fragment>
              {stats(text)}
              <VerticalCharCursor />
            </React.Fragment>
          )
        default:
          return (
            <React.Fragment>
              {stats(text)}
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

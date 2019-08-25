import { Paper, Theme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import * as Automerge from 'automerge'
import * as React from 'react'

const useStyles = makeStyles((theme: Theme) => ({
  outputBuffer: {
    height: '100%',
    overflow: 'auto',
    padding: theme.spacing(0, 1),
  },
  outputBufferPre: {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    fontSize: 14,
    lineHeight: 1.75,
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
  text: Automerge.Text
}

export default function SexpTextAtomComponent({
  text,
}: SexpTextAtomComponentProps): React.ReactElement {
  const classes = useStyles()

  const textString = text.join('')
  const unselectedText = textString.slice(0, -1)
  const lastChar = textString.slice(-1)

  const textWithCursor = ((): React.ReactNode => {
    switch (lastChar) {
      case '\n':
        return (
          <React.Fragment>
            {textString}
            <VerticalCharCursor />
          </React.Fragment>
        )
      case '':
        return <VerticalCharCursor />
      default:
        return (
          <React.Fragment>
            {unselectedText}
            <DirectedCharCursor char={lastChar} />
          </React.Fragment>
        )
    }
  })()

  return (
    <Paper className={classes.outputBuffer}>
      <pre className={classes.outputBufferPre}>{textWithCursor}</pre>
    </Paper>
  )
}

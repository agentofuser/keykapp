import {
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Theme,
} from '@material-ui/core'
import { getObjectId, Text } from 'automerge'
import * as React from 'react'
import { stringClamper } from '../kitchensink/purefns'
import { isSexpItemFocused, getCurrentFocusCursorIdx } from '../state'
import { AppState, Sexp, SexpList } from '../types'

const useStyles = makeStyles((theme: Theme) => ({
  surface: {
    height: '100%',
    overflow: 'auto',
    padding: theme.spacing(0, 1),
  },
  focused: {
    border: '1px solid fuchsia',
    borderTop: 'none',
  },
  zerothFocus: {
    border: '1px solid fuchsia',
    borderLeft: 'none',
    borderBottom: 'none',
    borderRight: 'none',
  },
}))

function sexpDecoration(sexp: Sexp): string {
  if (sexp instanceof Text) {
    return '📝 '
  } else {
    return `📃 ${sexp.length}⋮ `
  }
}

function textSummary(text: Text): string {
  const str =
    text.length > 0 ? stringClamper(44)(text.join('').split('\n')[0]) : ''
  return str
}

function sexpSummary(sexp: Sexp): string {
  if (sexp instanceof Text) {
    return textSummary(sexp)
  } else {
    if (sexp.length === 0) {
      return ''
    } else {
      return sexpSummary(sexp[0])
    }
  }
}

function SexpItem({
  state,
  sexp,
}: {
  state: AppState
  sexp: Sexp
}): React.ReactElement {
  const classes = useStyles()

  const primaryText = sexpDecoration(sexp) + sexpSummary(sexp)

  const className =
    state.syncRoot && isSexpItemFocused(state.syncRoot, sexp)
      ? classes.focused
      : ''

  return (
    <ListItem divider className={className}>
      <ListItemText primary={primaryText} />
    </ListItem>
  )
}

export default function SexpListComponent({
  state,
  list,
}: {
  state: AppState
  list: SexpList
}): React.ReactElement {
  const classes = useStyles()

  const listItems = list.map(
    (sexp: Sexp): React.ReactElement => (
      <SexpItem state={state} sexp={sexp} key={getObjectId(sexp)} />
    )
  )

  const className =
    state.syncRoot && getCurrentFocusCursorIdx(state.syncRoot) === 0
      ? classes.zerothFocus
      : ''

  return (
    <Paper className={classes.surface}>
      <List className={className}>{listItems}</List>
    </Paper>
  )
}

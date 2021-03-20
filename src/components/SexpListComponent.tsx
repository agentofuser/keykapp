import {
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Theme,
} from '@material-ui/core'
import * as React from 'react'
import { Sexp } from '../kapps/Sexp'
import { getCurrentFocusCursorIdx, isSexpItemFocused } from '../state'
import { AppState, SexpList, SexpText, SexpNode } from '../types'

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
  listItemText: {
    wordWrap: 'break-word',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}))

function sexpDecoration(sexp: SexpNode): string {
  if (Sexp.isText(sexp)) {
    return '📝 '
  } else {
    return `📃 ${sexp.children.length}⋮ `
  }
}

function textSummary(sexpText: SexpText): string {
  const str = sexpText.value.length > 0 ? sexpText.value.split('\n')[0] : ''
  return str
}

function sexpSummary(sexp: SexpNode): string {
  if (Sexp.isText(sexp)) {
    return textSummary(sexp)
  } else {
    if (sexp.children.length === 0) {
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
  sexp: SexpNode
}): React.ReactElement {
  const classes = useStyles()

  const primaryText = sexpDecoration(sexp) + sexpSummary(sexp)

  const className =
    state.syncRoot && isSexpItemFocused(state.syncRoot, sexp)
      ? classes.focused
      : ''

  return (
    <ListItem divider className={className}>
      <ListItemText className={classes.listItemText} primary={primaryText} />
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

  const listItems = list.children.map(
    (sexp: SexpNode): React.ReactElement => (
      <SexpItem state={state} sexp={sexp} key={sexp.uuid} />
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

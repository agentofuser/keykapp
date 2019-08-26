import * as React from 'react'
import { SexpList, Sexp, AppState } from '../types'
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  makeStyles,
  Theme,
} from '@material-ui/core'
import { getObjectId, Text } from 'automerge'
import { stringClamper } from '../kitchensink/purefns'
import { isSexpItemFocused } from '../state'

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
}))

function textSummary(text: Text): string {
  return stringClamper(44)(text.join('').split('\n')[0])
}

function SexpItem({
  state,
  sexp,
}: {
  state: AppState
  sexp: Sexp
}): React.ReactElement {
  const classes = useStyles()
  let primaryText
  if (sexp instanceof Text) {
    primaryText = textSummary(sexp)
  } else if (sexp instanceof Array) {
    primaryText = `List with ${sexp.length} items`
  } else {
    primaryText = 'ERROR: Unknown sexp type'
  }

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
  return (
    <Paper className={classes.surface}>
      <List>{listItems}</List>
    </Paper>
  )
}

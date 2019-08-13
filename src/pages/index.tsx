import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Theme,
} from '@material-ui/core'
import Box from '@material-ui/core/Box'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import { findFirst } from 'fp-ts/es6/Array'
import { fold, none, Option, toNullable } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import Keypad, { layout } from '../components/Keypad'
import { sleep } from '../kitchensink/effectfns'
import { stringClamper, wordCount } from '../kitchensink/purefns'
import {
  appReducer,
  currentWaypoint,
  loadSyncRootFromBrowserGit,
  makeInitialAppState,
  setupGit,
} from '../state'
import { Keybinding } from '../types'

const useStyles = makeStyles((theme: Theme) => ({
  mainGridContainer: {
    height: 768,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
    gridColumnGap: '16px',
    gridRowGap: '16px',
  },
  display: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    gridColumnGap: '16px',
  },
  displayItem: {
    padding: theme.spacing(2, 2),
  },
  appStateViz: {
    width: '100%',
    border: 0,
  },
  outputBuffer: {
    padding: theme.spacing(1, 4),
    height: 376,
  },
  outputBufferPre: {
    overflow: 'hidden',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    fontSize: 20,
    lineHeight: 2,
  },
}))

// Set up browser-local git repository
let isGitReady = false
setupGit().then((): void => {
  isGitReady = true
})

export default function App(): React.ReactNode {
  const [state, dispatch] = React.useReducer(appReducer, makeInitialAppState())

  function onKeyUp(event: KeyboardEvent): void {
    event.stopPropagation()
    event.preventDefault()
    const waypointOption = currentWaypoint(state)
    const waypoint = toNullable(waypointOption)
    const keybinding: Option<Keybinding> = waypoint
      ? findFirst(
          ([keyswitch, _waypoint]: Keybinding): boolean =>
            keyswitch.key === event.key
        )(layout(waypointOption))
      : none

    fold(
      (): void => {},
      (keybinding: Keybinding): void =>
        dispatch({
          type: 'KeyswitchUp',
          data: {
            timestamp: Date.now(),
            keybinding,
          },
        })
    )(keybinding)
  }

  React.useEffect((): void => {
    console.info('Loading state from git...')

    const isSyncRootLoaded = !!state.syncRoot

    sleep(1000).then((): void => {
      if (isGitReady && !isSyncRootLoaded) {
        loadSyncRootFromBrowserGit(state, dispatch)
      }
    })
  })

  React.useEffect((): (() => void) => {
    window.addEventListener('keyup', onKeyUp)

    return (): void => {
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  const classes = useStyles()

  return (
    <React.Fragment>
      <Helmet title="Keykapp"></Helmet>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h5" component="h1" gutterBottom>
            Keykapp
          </Typography>
          <div className={classes.mainGridContainer}>
            <div className={classes.display}>
              <Paper className={classes.displayItem}>
                <Typography>commandNgrams</Typography>
              </Paper>
              <Paper className={classes.outputBuffer}>
                <pre className={classes.outputBufferPre}>
                  {state.syncRoot
                    ? stringClamper(280)(state.syncRoot.currentBuffer) + '|'
                    : 'Loading...'}
                </pre>
              </Paper>
              <Paper className={classes.displayItem}>
                <Typography>stats</Typography>

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>characters</TableCell>
                      <TableCell>
                        {state.syncRoot
                          ? state.syncRoot.currentBuffer.length
                          : 'Loading...'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>words</TableCell>
                      <TableCell>
                        {state.syncRoot
                          ? wordCount(state.syncRoot.currentBuffer)
                          : 'Loading...'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </div>
            <Keypad
              dispatch={dispatch}
              layout={layout(currentWaypoint(state))}
            />
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}

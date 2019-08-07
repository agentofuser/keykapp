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
import { head, of } from 'fp-ts/es6/NonEmptyArray'
import { fold, Option } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import Keypad, { layout } from '../components/Keypad'
import { getKappById } from '../kapps'
import { wordCount } from '../kitchensink/purefns'
import { zoomInto, zoomOutToRoot } from '../navigation'
import { newHuffmanRoot } from '../navigation/huffman'
import { logAction } from '../state'
import { AppAction, AppState, Keybinding } from '../types'
import * as Automerge from 'automerge'

const useStyles = makeStyles((theme: Theme) => ({
  mainGridContainer: {
    height: 768,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1.5fr 1fr',
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
    padding: theme.spacing(2, 2),
  },
  outputBufferPre: {
    whiteSpace: 'pre-wrap',
    fontSize: 22,
    margin: '1rem',
  },
}))

function appReducer(prevState: AppState, action: AppAction): AppState {
  let nextState = prevState

  nextState = logAction(nextState, action)

  const [_keyswitch, waypoint] = action.data.keybinding

  const kappIdv0 = waypoint.value.kappIdv0
  if (!kappIdv0) {
    nextState = zoomInto(waypoint)(nextState, action)
  } else {
    const kapp = getKappById(kappIdv0)

    if (kapp) {
      let stateAfterKapp = kapp.instruction(nextState, action)
      // Update huffman tree based on kapp's updated weight calculated from
      // the appActionLog
      stateAfterKapp = {
        ...stateAfterKapp,
        rootWaypoint: newHuffmanRoot({
          appActionLog: stateAfterKapp.appActionLog,
        }),
      }

      if (
        stateAfterKapp.waypointBreadcrumbs === prevState.waypointBreadcrumbs
      ) {
        nextState = zoomOutToRoot(stateAfterKapp, action)
      } else {
        // Don't zoom out to root waypoint if the kapp changed the
        // current waypoint already, eg. :navUp.
        nextState = stateAfterKapp
      }
    } else {
      throw new Error('Could not find kapp from id given.')
    }
  }

  return nextState
}

export default function App(): React.ReactNode {
  const userLog: AppAction[] = []
  const initialHuffmanRoot = newHuffmanRoot({ appActionLog: userLog })
  const initialAppState: AppState = {
    syncDoc: Automerge.init<any>(),
    appActionLog: userLog,
    currentBuffer: '',
    rootWaypoint: initialHuffmanRoot,
    waypointBreadcrumbs: of(initialHuffmanRoot),
  }
  const [state, dispatch] = React.useReducer(appReducer, initialAppState)

  function onKeyUp(event: KeyboardEvent): void {
    event.stopPropagation()
    event.preventDefault()
    const keybinding: Option<Keybinding> = findFirst(
      ([keyswitch, _waypoint]: Keybinding): boolean =>
        keyswitch.key === event.key
    )(layout(head(state.waypointBreadcrumbs)))

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

  React.useEffect(() => {
    window.addEventListener('keyup', onKeyUp)

    return () => {
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
                  {state.currentBuffer + '|'}
                </pre>
              </Paper>
              <Paper className={classes.displayItem}>
                <Typography>stats</Typography>

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>characters</TableCell>
                      <TableCell>{state.currentBuffer.length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>words</TableCell>
                      <TableCell>{wordCount(state.currentBuffer)}</TableCell>
                    </TableRow>
                    {/* <TableRow>
                      <TableCell>bytes</TableCell>
                      <TableCell>
                        {new Blob([state.currentBuffer]).size}
                      </TableCell>
                    </TableRow> */}
                  </TableBody>
                </Table>
              </Paper>
            </div>
            <Keypad
              dispatch={dispatch}
              layout={layout(head(state.waypointBreadcrumbs))}
            />
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}

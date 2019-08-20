import { Paper, Theme } from '@material-ui/core'
import Container from '@material-ui/core/Container'
import { makeStyles } from '@material-ui/styles'
import { findFirst } from 'fp-ts/es6/Array'
import { fold, none, Option, toNullable } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import Keypad, { layout } from '../components/Keypad'
import { stringClamper } from '../kitchensink/purefns'
import {
  appReducer,
  currentSexpAtom,
  currentWaypoint,
  loadSyncRootFromBrowserGit,
  makeInitialAppState,
  setupGit,
} from '../state'
import { Keybinding } from '../types'

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    height: '100%',
    fontFamily: 'monospace',
  },
  display: {
    height: '50%',
    paddingBottom: '1em',
  },
  outputBuffer: {
    height: '100%',
    padding: theme.spacing(0, 1),
  },
  outputBufferPre: {
    overflow: 'hidden',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    fontSize: 16,
    lineHeight: 1.75,
  },
}))

let hasGitSetupStarted = false

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
    // Set up browser-local git repository
    if (!hasGitSetupStarted) {
      hasGitSetupStarted = true
      console.info('Setting up local git repo...')
      setupGit().then((): void => {
        console.info('Git repo is ready.')
        const isSyncRootLoaded = !!state.syncRoot
        if (!isSyncRootLoaded) {
          console.info('Loading state from git log...')
          loadSyncRootFromBrowserGit(state, dispatch)
        }
      })
    }
  })

  React.useEffect((): (() => void) => {
    window.addEventListener('keyup', onKeyUp)

    return (): void => {
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  const classes = useStyles()

  const currentAtom = state.syncRoot ? currentSexpAtom(state.syncRoot) : null

  const atomContent = currentAtom ? currentAtom.join('') : ''

  return (
    <React.Fragment>
      <Helmet title="Keykapp"></Helmet>
      <Container className={classes.container} maxWidth="sm">
        <div className={classes.display}>
          <Paper className={classes.outputBuffer}>
            <pre className={classes.outputBufferPre}>
              {state.syncRoot
                ? stringClamper(140)(atomContent) + '|'
                : 'Loading...'}
            </pre>
          </Paper>
        </div>
        <Keypad dispatch={dispatch} layout={layout(currentWaypoint(state))} />
      </Container>
    </React.Fragment>
  )
}

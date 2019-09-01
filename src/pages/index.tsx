import Container from '@material-ui/core/Container'
import { makeStyles } from '@material-ui/styles'
import * as Automerge from 'automerge'
import { findFirst } from 'fp-ts/es6/Array'
import { fold, none, Option, toNullable } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import Keypad, { layout } from '../components/Keypad'
import SexpComponent from '../components/Sexp'
import { devStringyAndLog } from '../kitchensink/effectfns'
import {
  appReducer,
  currentWaypoint,
  dispatchMiddleware,
  loadSyncRootFromBrowserGit,
  makeInitialAppState,
  setupGit,
  zoomedSexp,
} from '../state'
import { Keybinding } from '../types'

const useStyles = makeStyles(() => ({
  container: {
    height: '100%',
  },
  display: {
    height: '50%',
    paddingBottom: '1em',
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
        )(layout(state, waypointOption))
      : none

    fold(
      (): void => {},
      (keybinding: Keybinding): void =>
        dispatchMiddleware(dispatch)({
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

  let display
  if (state.syncRoot) {
    const sexp = zoomedSexp(state.syncRoot)
    devStringyAndLog(state.syncRoot)
    devStringyAndLog(sexp)
    display = <SexpComponent state={state} sexp={sexp} />
  } else {
    display = (
      <SexpComponent state={state} sexp={new Automerge.Text('Loading...')} />
    )
  }

  return (
    <React.Fragment>
      <Helmet title="Keykapp"></Helmet>
      <Container className={classes.container} maxWidth="sm">
        <div className={classes.display}>{display}</div>
        <Keypad dispatch={dispatch} state={state} />
      </Container>
    </React.Fragment>
  )
}

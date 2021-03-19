import Container from '@material-ui/core/Container'
import { makeStyles } from '@material-ui/styles'
import { findFirst } from 'fp-ts/es6/Array'
import { fold, none, Option, toNullable } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import Keypad, { layout } from '../components/Keypad'
import SexpComponent from '../components/Sexp'
import {
  asciiIdv0Path,
  escapeKeyswitch,
  spacebarKeyswitch,
} from '../constants'
import {
  appReducer,
  currentWaypoint,
  dispatchMiddleware,
  makeInitialAppState,
  zoomedSexp,
} from '../state'
import {
  InputModeMenu,
  Keybinding,
  KeypadUp,
  Keyswitch,
  RunKapp,
} from '../types'

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
    if (event.isComposing || event.keyCode === 229) {
      return
    }

    event.stopPropagation()
    event.preventDefault()

    const waypointOption = currentWaypoint(state)
    const waypoint = toNullable(waypointOption)
    if (state.tempRoot.inputMode == 'MenuMode') {
      if (event.key == ' ' && waypoint) {
        const keybinding: Keybinding = [spacebarKeyswitch, waypoint]
        const keypadUp: KeypadUp = {
          type: 'KeypadUp',
          data: {
            timestamp: Date.now(),
            keybinding,
          },
        }
        dispatchMiddleware(dispatch)(keypadUp)
      } else {
        // FIXME: move the call to layout() out of the loop
        // Why is layout() being called at all? Shouldn't this have been calculated
        // and stored upon rendering the frame?
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
    } else {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key == 'Escape'
      ) {
        const keybinding: Keybinding = [escapeKeyswitch, waypoint]
        const inputModeMenu: InputModeMenu = {
          type: 'InputModeMenu',
          data: {
            timestamp: Date.now(),
            keybinding,
          },
        }
        dispatchMiddleware(dispatch)(inputModeMenu)
      } else {
        const kappIdv0 = `${asciiIdv0Path}${event.key.charCodeAt(0)}`
        const runKappAction: RunKapp = {
          type: 'RunKapp',
          data: {
            timestamp: Date.now(),
            kappIdv0,
          },
        }
        dispatchMiddleware(dispatch)(runKappAction)
      }
    }
  }

  React.useEffect((): (() => void) => {
    window.addEventListener('keyup', onKeyUp)

    return (): void => {
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  const classes = useStyles()

  const sexp = zoomedSexp(state.syncRoot)
  const display = <SexpComponent state={state} sexp={sexp} />

  return (
    <React.Fragment>
      <Helmet title="Keykapp"></Helmet>
      <Container className={classes.container} maxWidth="lg">
        <div className={classes.display}>{display}</div>
        <Keypad dispatch={dispatch} state={state} />
      </Container>
    </React.Fragment>
  )
}

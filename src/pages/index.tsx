import { Paper, Theme } from '@material-ui/core'
import Box from '@material-ui/core/Box'
import Container from '@material-ui/core/Container'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import { findFirst, zip } from 'fp-ts/es6/Array'
import { fold, Option } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import Keypad from '../components/Keypad'
import {
  AppAction,
  AppReducer,
  AppState,
  Command,
  Keybinding,
  Keyswitch,
  Layout,
} from '../types'
import { allKapps } from '../commands'

const useStyles = makeStyles((theme: Theme) => ({
  mainGridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '4fr 1fr',
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
}))

const allKeyswitches: Keyswitch[] = [
  { key: 'a' },
  { key: 's' },
  { key: 'd' },
  { key: 'f' },
  { key: 'j' },
  { key: 'k' },
  { key: 'l' },
  { key: ';' },
]

function loadBalancer(keyswitches: Keyswitch[], commands: Command[]): Layout {
  const keybindings = zip(keyswitches, commands)
  console.log({ keybindings })

  return new Map(keybindings)
}

const logAction: AppReducer = (prevState, action): AppState => {
  const newState = {
    appActionLog: [action, ...prevState.appActionLog],
    currentBuffer: prevState.currentBuffer,
    currentLayout: prevState.currentLayout,
  }

  return newState
}

function appReducer(prevState: AppState, action: AppAction): AppState {
  let mutatedState = prevState
  mutatedState = logAction(mutatedState, action)
  const { instruction } = action.data.command
  mutatedState = instruction(mutatedState, action)
  return mutatedState
}

export default function App(): React.ReactNode {
  const [state, dispatch] = React.useReducer(appReducer, {
    appActionLog: [],
    currentBuffer: '',
    currentLayout: loadBalancer(allKeyswitches, allKapps),
  })

  function onKeyUp(event: KeyboardEvent): void {
    event.stopPropagation()
    event.preventDefault()
    const keybinding: Option<Keybinding> = findFirst(
      ([keyswitch, _command]: Keybinding): boolean =>
        keyswitch.key === event.key
    )(Array.from(state.currentLayout.entries()))

    fold(
      (): void => {},
      ([keyswitch, command]: Keybinding): void =>
        dispatch({
          type: 'KeyswitchUp',
          data: {
            timestamp: Date.now(),
            keyswitch,
            command,
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
      <Helmet title="#Keykapp🧢"></Helmet>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h5" component="h1" gutterBottom>
            #Keykapp🧢
          </Typography>
          <div className={classes.mainGridContainer}>
            <div className={classes.display}>
              <Paper className={classes.displayItem}>
                <Typography>commandNgrams</Typography>
              </Paper>
              <Paper className={classes.outputBuffer}>
                <pre
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    margin: 0,
                  }}
                >
                  {state.currentBuffer}
                </pre>
              </Paper>
              <Paper className={classes.displayItem}>
                <Typography>
                  appState
                  <br />
                  <TextareaAutosize
                    className={classes.appStateViz}
                    rowsMax={40}
                    value={JSON.stringify(state, null, 2)}
                  ></TextareaAutosize>
                </Typography>
              </Paper>
            </div>
            <Keypad dispatch={dispatch} layout={state.currentLayout} />
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}

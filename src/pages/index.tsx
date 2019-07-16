import * as React from 'react'
import { Helmet } from 'react-helmet'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import Box from '@material-ui/core/Box'
import { makeStyles } from '@material-ui/styles'
import { findFirst, zip } from 'fp-ts/es6/Array'
import Keypad from '../components/Keypad'
import { fold, Option } from 'fp-ts/es6/Option'

const useStyles = makeStyles({
  mainGridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '4fr 1fr',
    gridColumnGap: '16px',
    gridRowGap: '16px',
  },
  display: {
    border: '1px solid green',
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
  },
  displayItem: {
    border: '1px solid pink',
  },
  appStateViz: {
    width: '100%',
  },
  outputBuffer: {
    border: '1px solid pink',
    maxWidth: 600,
  },
})

const pushString = (char: string): React.Reducer<AppState, AppAction> => (
  prevState: AppState,
  _action: AppAction
): AppState => {
  const nextState = prevState
  nextState.currentBuffer = prevState.currentBuffer + char
  return nextState
}

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

const allCommands: Command[] = [
  {
    legend: 'write newline',
    instruction: pushString('\n'),
  },
  {
    legend: 'write space',
    instruction: pushString(' '),
  },
  {
    legend: "write '🧢'",
    instruction: pushString('🧢'),
  },
  {
    legend: "write 'o'",
    instruction: pushString('o'),
  },
  {
    legend: "write 'k'",
    instruction: pushString('k'),
  },
  {
    legend: 'upcase word',
    instruction: pushString('TBD'),
  },
  {
    legend: 'downcase word',
    instruction: pushString('TBD'),
  },
  {
    legend: 'delete word',
    instruction: pushString('TBD'),
  },
]

function loadBalancer(keyswitches: Keyswitch[], commands: Command[]): Layout {
  const keybindings = zip(keyswitches, commands)
  console.log({ keybindings })

  return new Map(keybindings)
}

type Legend = React.ReactNode
type Instruction = React.Reducer<AppState, AppAction>

export interface Keyswitch {
  key: React.Key
}

export interface Command {
  legend: Legend
  instruction: Instruction
}

export type Keybinding = [Keyswitch, Command]

export type Layout = Map<Keyswitch, Command>

export interface AppAction {
  type: string
  data: {
    timestamp: number
    keyswitch: Keyswitch
    command: Command
  }
}

type AppActionLog = AppAction[]

interface AppState {
  appActionLog: AppActionLog
  currentBuffer: string
  currentLayout: Layout
}

const logAction: React.Reducer<AppState, AppAction> = (
  prevState,
  action
): AppState => {
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
    currentLayout: loadBalancer(allKeyswitches, allCommands),
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
              <div className={classes.displayItem}>commandNgrams</div>
              <div className={classes.displayItem}>
                <pre className={classes.outputBuffer}>
                  <code>{state.currentBuffer}</code>
                </pre>
              </div>
              <div className={classes.displayItem}>
                appState
                <br />
                <TextareaAutosize
                  className={classes.appStateViz}
                  rowsMax={42}
                  value={JSON.stringify(state, null, 2)}
                ></TextareaAutosize>
              </div>
            </div>
            <Keypad dispatch={dispatch} layout={state.currentLayout} />
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}

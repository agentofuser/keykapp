import { Paper, Theme } from '@material-ui/core'
import Box from '@material-ui/core/Box'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import {
  findFirst,
  isNonEmpty,
  map,
  zip,
  reduceWithIndex,
} from 'fp-ts/es6/Array'
import { fold, none, Option, some } from 'fp-ts/es6/Option'
import * as React from 'react'
import { Helmet } from 'react-helmet'
import { allKapps } from '../commands'
import Keypad from '../components/Keypad'
import { zoomInto, zoomOutToRoot } from '../navigation'
import { makeWaypoint, mAryHuffmanTreeBuilder } from '../navigation/huffman'
import { logAction } from '../state'
import {
  AppAction,
  AppState,
  Kapp,
  Keybinding,
  Keyswitch,
  Layout,
  Waypoint,
} from '../types'

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

function loadBalancer(
  keyswitches: Keyswitch[],
  waypoints: Waypoint[]
): Layout {
  // waypoints are sorted by frequency, highest last
  const partition = reduceWithIndex(
    { even: [], odd: [] },
    (i, partition, waypoint) => {
      if (i % 2 === 0) {
        return { even: partition.even.concat(waypoint), odd: partition.odd }
      } else {
        return { even: partition.even, odd: partition.odd.concat(waypoint) }
      }
    }
  )(waypoints)

  const centerBiasedWaypoints = partition.even.concat(partition.odd.reverse())

  const keybindings = zip(keyswitches, centerBiasedWaypoints)

  return new Map(keybindings)
}

export function makeOrphanLeafWaypoint(kapp: Kapp): Waypoint {
  const value = {
    huffmanWeight: kapp.actuationCount,
    parent: none,
    kapp: some(kapp),
  }
  return makeWaypoint(value, [])
}

function appReducer(prevState: AppState, action: AppAction): AppState {
  let nextState = prevState

  nextState = logAction(nextState, action)

  const [_keyswitch, waypoint] = action.data.keybinding
  nextState = fold(
    (): AppState => zoomInto(waypoint)(nextState, action),
    (kapp: Kapp): AppState =>
      zoomOutToRoot(kapp.instruction(nextState, action), action)
  )(waypoint.value.kapp)

  return nextState
}

function layout(waypoint: Waypoint): Layout {
  return loadBalancer(allKeyswitches, waypoint.forest)
}

export default function App(): React.ReactNode {
  const huffmanOrphanLeaves = map(makeOrphanLeafWaypoint)(allKapps)
  const huffmanTreeBuilder = mAryHuffmanTreeBuilder(allKeyswitches.length)
  let huffmanRoot
  if (isNonEmpty(huffmanOrphanLeaves)) {
    huffmanRoot = huffmanTreeBuilder(huffmanOrphanLeaves)
  } else {
    throw new Error('Could not find any Kapps')
  }

  const [state, dispatch] = React.useReducer(appReducer, {
    appActionLog: [],
    currentBuffer: '',
    rootWaypoint: huffmanRoot,
    currentWaypoint: huffmanRoot,
  })

  function onKeyUp(event: KeyboardEvent): void {
    event.stopPropagation()
    event.preventDefault()
    const keybinding: Option<Keybinding> = findFirst(
      ([keyswitch, _waypoint]: Keybinding): boolean =>
        keyswitch.key === event.key
    )(Array.from(layout(state.currentWaypoint).entries()))

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
                <Typography>appState</Typography>
              </Paper>
            </div>
            <Keypad
              dispatch={dispatch}
              layout={layout(state.currentWaypoint)}
            />
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}

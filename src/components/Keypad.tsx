import { makeStyles } from '@material-ui/styles'
import {
  flatten,
  map,
  partition,
  partitionWithIndex,
  reverse,
  sortBy,
  zip,
} from 'fp-ts/es6/Array'
import { fold, Option } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import * as React from 'react'
import { allKeyswitches } from '../constants'
import { menuUpKapp } from '../kapps'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import { currentWaypoint } from '../state'
import {
  AppAction,
  AppState,
  Keybinding,
  Keyswitch,
  Layout,
  Menu,
  RightHand,
  Waypoint,
} from '../types'
import HuffmanButton from './HuffmanButton'

const useStyles = makeStyles({
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridColumnGap: '1em',
    justifyContent: 'center',
    height: '50%',
  },
  hand: {
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gridRowGap: '1em',
  },
})

function loadBalancer(
  state: AppState,
  keyswitches: Keyswitch[],
  waypoints: Waypoint[]
): Layout {
  const zoomOutWaypoint = makeOrphanLeafWaypoint(null, menuUpKapp)
  // reverse so that if there are less waypoints than keyswitches, we put those
  // waypoints at the center, not all at the left
  const sortedDescWeightWaypoints = reverse(waypoints).concat(zoomOutWaypoint)

  // alternate between right and left hands
  const { left, right } = partitionWithIndex(
    (i: number, _waypoint: Menu): boolean => i % 2 === 0
  )(sortedDescWeightWaypoints)
  const sideBalancedWaypoints = flatten(
    // FIXME replace with finer-grained load-balancing, not whole hands.
    // state.tempRoot.keyUpCount % 2 === 0 ? zip(left, right) : zip(right, left)
    zip(left, right)
  )

  let keybindings: Keybinding[] = []

  const lowestActuationCost = ord.contramap(
    ordNumber,
    (keyswitch: Keyswitch): number => keyswitch.actuationCost
  )
  const sortedAscCostKeyswitches = sortBy([lowestActuationCost])(keyswitches)

  keybindings = keybindings.concat(
    zip(sortedAscCostKeyswitches, sideBalancedWaypoints)
  )

  const ascendingIndex = ord.contramap(
    ordNumber,
    ([keyswitch, _waypoint]: Keybinding): number => keyswitch.index
  )
  keybindings = sortBy([ascendingIndex])(keybindings)

  return keybindings
}

export function layout(
  state: AppState,
  waypointOption: Option<Waypoint>
): Layout {
  return fold(
    (): Layout => [],
    (waypoint: Waypoint): Layout =>
      loadBalancer(state, allKeyswitches, waypoint.forest)
  )(waypointOption)
}

interface KeypadProps {
  dispatch: React.Dispatch<AppAction>
  state: AppState
}

export default function Keypad({
  dispatch,
  state,
}: KeypadProps): React.ReactElement {
  const classes = useStyles()

  const { left, right } = partition(
    (keybinding: Keybinding): boolean => keybinding[0].hand === RightHand
  )(layout(state, currentWaypoint(state)))

  const hand = map(
    (keybinding: Keybinding): React.ReactElement => (
      <HuffmanButton
        state={state}
        dispatch={dispatch}
        keybinding={keybinding}
        key={`react-collection-key-${keybinding[0].key}`}
      ></HuffmanButton>
    )
  )

  return (
    <div className={classes.keypad}>
      <div className={classes.hand}>{hand(left)}</div>
      <div className={classes.hand}>{hand(right).reverse()}</div>
    </div>
  )
}

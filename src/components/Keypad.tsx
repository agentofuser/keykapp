import { makeStyles } from '@material-ui/styles'
import { map, partition, reverse, sortBy, zip } from 'fp-ts/es6/Array'
import { fold, Option } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import * as React from 'react'
import { menuUpKapp } from '../kapps'
import { allKeyswitches } from '../constants'
import { makeOrphanLeafWaypoint } from '../navigation/huffman'
import { currentWaypoint } from '../state'
import {
  AppAction,
  AppState,
  Keybinding,
  Keyswitch,
  Layout,
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
  keyswitches: Keyswitch[],
  waypoints: Waypoint[]
): Layout {
  const zoomOutWaypoint = makeOrphanLeafWaypoint(null, menuUpKapp)
  // reverse so that if there are less waypoints than keyswitches, we put those
  // waypoints at the center, not all at the left
  const sortedDescWeightWaypoints = reverse(waypoints).concat(zoomOutWaypoint)

  let keybindings: Keybinding[] = []

  const lowestActuationCost = ord.contramap(
    ordNumber,
    (keyswitch: Keyswitch): number => keyswitch.actuationCost
  )
  const sortedAscCostKeyswitches = sortBy([lowestActuationCost])(keyswitches)

  keybindings = keybindings.concat(
    zip(sortedAscCostKeyswitches, sortedDescWeightWaypoints)
  )

  const ascendingIndex = ord.contramap(
    ordNumber,
    ([keyswitch, _waypoint]: Keybinding): number => keyswitch.index
  )
  keybindings = sortBy([ascendingIndex])(keybindings)

  return keybindings
}

export function layout(waypointOption: Option<Waypoint>): Layout {
  return fold(
    (): Layout => [],
    (waypoint: Waypoint): Layout =>
      loadBalancer(allKeyswitches, waypoint.forest)
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
  )(layout(currentWaypoint(state)))

  const hand = map(
    (keybinding: Keybinding): React.ReactElement => (
      <HuffmanButton
        dispatch={dispatch}
        keybinding={keybinding}
        key={`react-collection-key-${keybinding[0].key}`}
      ></HuffmanButton>
    )
  )

  return (
    <div className={classes.keypad}>
      <div className={classes.hand}>{hand(left).reverse()}</div>
      <div className={classes.hand}>{hand(right)}</div>
    </div>
  )
}

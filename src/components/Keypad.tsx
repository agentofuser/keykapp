import { makeStyles } from '@material-ui/styles'
import { map, partition, reverse, sortBy, zip } from 'fp-ts/es6/Array'
import { fold, Option } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import * as React from 'react'
import { allKeyswitches } from '../constants'
import {
  AppAction,
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
    height: '100%',
  },
  hand: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gridRowGap: '1em',
    justifyContent: 'center',
  },
})

function loadBalancer(
  keyswitches: Keyswitch[],
  waypoints: Waypoint[]
): Layout {
  // if there are less waypoints than keyswitches, put those waypoints at
  // the center, not all at the left
  const sortedDescWeightWaypoints = reverse(waypoints)

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
  layout: Layout
}

export default function Keypad({
  dispatch,
  layout,
}: KeypadProps): React.ReactElement {
  const classes = useStyles()

  const { left, right } = partition(
    (keybinding: Keybinding): boolean => keybinding[0].hand === RightHand
  )(layout)

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

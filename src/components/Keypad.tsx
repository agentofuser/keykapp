import { makeStyles } from '@material-ui/styles'
import { map, partition, reverse, sortBy, zip } from 'fp-ts/es6/Array'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import * as React from 'react'
import { navRootWaypointBuilder, navUpWaypointBuilder } from '../kapps'
import { allKeyswitches } from '../constants'
import {
  AppAction,
  Keybinding,
  Keyswitch,
  Layout,
  RightHand,
  Waypoint,
} from '../types'
import Button from './Button'

const useStyles = makeStyles({
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridColumnGap: '16px',
    justifyContent: 'center',
  },
  hand: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 135px)',
    gridColumnGap: '12px',
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
  let keybindings: Keybinding[] = [[keyswitches[0], navUpWaypointBuilder()]]

  // leave first and last keyswitches for 'back' and 'home'
  const dynamicKeyswitches = keyswitches.slice(1, -1)

  const lowestActuationCost = ord.contramap(
    ordNumber,
    (keyswitch: Keyswitch): number => keyswitch.actuationCost
  )
  const sortedAscCostKeyswitches = sortBy([lowestActuationCost])(
    dynamicKeyswitches
  )

  keybindings = keybindings.concat(
    zip(sortedAscCostKeyswitches, sortedDescWeightWaypoints)
  )

  keybindings.push([
    keyswitches[keyswitches.length - 1],
    navRootWaypointBuilder(),
  ])

  const ascendingIndex = ord.contramap(
    ordNumber,
    ([keyswitch, _waypoint]: Keybinding): number => keyswitch.index
  )
  keybindings = sortBy([ascendingIndex])(keybindings)

  return keybindings
}

export function layout(waypoint: Waypoint): Layout {
  return loadBalancer(allKeyswitches, waypoint.forest)
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
      <Button
        dispatch={dispatch}
        keybinding={keybinding}
        key={`react-collection-key-${keybinding[0].key}`}
      ></Button>
    )
  )

  return (
    <div className={classes.keypad}>
      <div className={classes.hand}>{hand(left)}</div>
      <div className={classes.hand}>{hand(right)}</div>
    </div>
  )
}

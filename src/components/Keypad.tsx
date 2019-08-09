import { makeStyles } from '@material-ui/styles'
import { getObjectId } from 'automerge'
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
  WaypointUuid,
  SyncRoot,
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

  // FIXME
  // const navUpKeybinding = [keyswitches[0], navUpWaypointBuilder()]
  // let keybindings: Keybinding[] = [navUpKeybinding]
  let keybindings: Keybinding[] = []

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
    zip(
      sortedAscCostKeyswitches,
      map((waypoint: Waypoint): WaypointUuid => getObjectId(waypoint))(
        sortedDescWeightWaypoints
      )
    )
  )

  // FIXME
  // const navRootKeybinding = [
  //   keyswitches[keyswitches.length - 1],
  //   navRootWaypointBuilder(),
  // ]
  // keybindings.push(navRootKeybinding)

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
  state: SyncRoot
  dispatch: React.Dispatch<AppAction>
  layout: Layout
}

export default function Keypad({
  state,
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
        state={state}
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

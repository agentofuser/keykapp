import { Button } from '@material-ui/core'
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
import { homerowKeyswitches } from '../constants'
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
    gridTemplateRows: '1fr 1fr',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateAreas: `
      'leftHand rightHand'
      'spacebar spacebar'
    `,
    gridColumnGap: '2em',
    gridRowGap: '2em',
    justifyContent: 'center',
    height: '16%',
  },
  hand: {
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(1, 1fr)',
    gridColumnGap: '0.5rem',
  },
  leftHand: {
    gridArea: 'leftHand',
  },
  rightHand: {
    gridArea: 'rightHand',
  },
  spacebar: {
    gridArea: 'spacebar',
  },
})

function loadBalancer(
  state: AppState,
  keyswitches: Keyswitch[],
  waypoints: Waypoint[]
): Layout {
  // reverse so that if there are less waypoints than keyswitches, we put those
  // waypoints at the center, not all at the left
  const sortedDescWeightWaypoints = reverse(waypoints)

  // alternate between right and left hands for different depths of the huffman
  // tree. this leads to better load-balancing while keeping things predictable
  // for improved motor learning.
  const { left, right } = partitionWithIndex(
    (i: number, _waypoint: Menu): boolean => i % 2 === 0
  )(sortedDescWeightWaypoints)
  const sideBalancedWaypoints = flatten(
    state.tempRoot.waypointBreadcrumbs.length % 2 === 0
      ? zip(left, right)
      : zip(right, left)
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
      loadBalancer(state, homerowKeyswitches, waypoint.forest)
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
    (keybinding: Keybinding): React.ReactElement => {
      const keyswitch = keybinding[0]
      return (
        <HuffmanButton
          state={state}
          dispatch={dispatch}
          keybinding={keybinding}
          key={`react-collection-key-${keyswitch.key}`}
        ></HuffmanButton>
      )
    }
  )

  return (
    <div className={classes.keypad}>
      <div className={[classes.hand, classes.leftHand].join(' ')}>
        {hand(left)}
      </div>
      <div className={[classes.hand, classes.rightHand].join(' ')}>
        {hand(right)}
      </div>
      <Button className={classes.spacebar}>:keypad-up</Button>
    </div>
  )
}

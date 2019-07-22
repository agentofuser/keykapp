import { makeStyles } from '@material-ui/styles'
import { map, reduceWithIndex, zip } from 'fp-ts/es6/Array'
import * as React from 'react'
import { AppAction, Keybinding, Layout, Keyswitch, Waypoint } from '../types'
import Button from './Button'
import { allKeyswitches } from '../constants'
import { navUpWaypointBuilder, navRootWaypointBuilder } from '../commands'

const useStyles = makeStyles({
  keypad: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridColumnGap: '16px',
    margin: '0 32px',
  },
})

function loadBalancer(
  keyswitches: Keyswitch[],
  waypoints: Waypoint[]
): Layout {
  // waypoints are sorted by frequency, highest last
  const partition = reduceWithIndex(
    { even: [], odd: [] },
    (
      i: number,
      partition: { even: Waypoint[]; odd: Waypoint[] },
      waypoint: Waypoint
    ): { even: Waypoint[]; odd: Waypoint[] } => {
      if (i % 2 === 0) {
        return { even: partition.even.concat(waypoint), odd: partition.odd }
      } else {
        return { even: partition.even, odd: partition.odd.concat(waypoint) }
      }
    }
  )(waypoints)

  const centerBiasedWaypoints = partition.even.concat(partition.odd.reverse())

  // TODO if there are less waypoints than keyswitches, put those waypoints at
  // the center, not all at the left

  const keybindings = zip(
    keyswitches,
    [navUpWaypointBuilder()]
      .concat(centerBiasedWaypoints)
      .concat([navRootWaypointBuilder()])
  )

  return new Map(keybindings)
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

  const keybindings = map(
    (keybinding: Keybinding): React.ReactElement => (
      <Button
        dispatch={dispatch}
        keybinding={keybinding}
        key={`react-collection-key-${keybinding[0].key}`}
      ></Button>
    )
  )(Array.from(layout.entries()))

  return <div className={classes.keypad}>{keybindings}</div>
}

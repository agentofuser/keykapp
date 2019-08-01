import {
  filter,
  foldLeft,
  foldMap as foldMapArray,
  getMonoid,
  isNonEmpty,
  map,
  sortBy,
  splitAt,
} from 'fp-ts/es6/Array'
import { cons, head, NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import { fold, none, some } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { foldMap as foldMapTree, make } from 'fp-ts/es6/Tree'
import { allKeyswitches, asciiIdv0Path } from '../constants'
import { charCounts } from '../datasets/tweet'
import { userlandKapps } from '../kapps'
import { kappLog } from '../state'
import { AppAction, Kapp, Waypoint, WaypointValue } from '../types'

const byHuffmanWeightDesc = ord.contramap(
  ordNumber,
  (waypointValue: WaypointValue): number => -waypointValue.huffmanWeight
)
const sortByHuffmanWeightDesc = sortBy([byHuffmanWeightDesc])

export function reachableKapps(waypoint: Waypoint): Kapp[] {
  const waypointValueM = getMonoid<WaypointValue>()
  const sortedKappWaypointValues: WaypointValue[] = sortByHuffmanWeightDesc(
    foldMapTree(waypointValueM)(
      (waypointValue: WaypointValue): WaypointValue[] => {
        const kappWaypointValue = fold(
          (): WaypointValue[] => [],
          (_kapp: Kapp): WaypointValue[] => [waypointValue]
        )(waypointValue.kapp)
        return kappWaypointValue
      }
    )(waypoint)
  )

  const kappM = getMonoid<Kapp>()
  const kapps = foldMapArray(kappM)((waypointValue: WaypointValue): Kapp[] =>
    fold((): Kapp[] => [], (kapp: Kapp): Kapp[] => [kapp])(waypointValue.kapp)
  )(sortedKappWaypointValues)
  return kapps
}

export type Destinations = Waypoint[]

// This function is a wrapper around Tree.make to make a node with a parent.
// It does not, by itself, build the tree according to the Huffman algorithm.
// For that, use mAryHuffmanTreeBuilder().
export function makeWaypoint(
  value: WaypointValue,
  orphanForest: Destinations
): Waypoint {
  const tree: Waypoint = make(value, orphanForest)
  map(
    (child: Waypoint): Waypoint => ((child.value.parent = some(tree)), child)
  )(orphanForest)
  return tree
}

function kappLogCount(appActionLog: AppAction[], kapp: Kapp): number {
  const log = kappLog(appActionLog)
  return filter((loggedKapp: Kapp): boolean => loggedKapp === kapp)(log).length
}

function kappTwitterCount(kapp: Kapp): number {
  const idv0 = kapp.idv0

  let twitterCount = 0
  if (idv0.match(asciiIdv0Path)) {
    const pathSegments = idv0
      .split('/')
      .filter((s: string): boolean => s !== '')
    const last = pathSegments.length - 1
    const charCodeString = pathSegments[last]
    const charCode = parseInt(charCodeString, 10)
    const char = String.fromCharCode(charCode)

    twitterCount = charCounts[char] || 0
    twitterCount = Math.floor(twitterCount / 100)
  }
  return twitterCount
}

function huffmanWeightFromKapp(appActionLog: AppAction[], kapp: Kapp): number {
  const idv0 = kapp.idv0
  let manualWeight = 0
  let twitterCount = kappTwitterCount(kapp)
  let logCount = kappLogCount(appActionLog, kapp)

  if (!idv0.match(asciiIdv0Path)) {
    manualWeight = 5
  }

  const finalWeight = twitterCount + manualWeight + logCount

  return finalWeight
}

export function makeOrphanLeafWaypoint(
  appActionLog: AppAction[],
  kapp: Kapp
): Waypoint {
  const value = {
    huffmanWeight: huffmanWeightFromKapp(appActionLog, kapp),
    parent: none,
    kapp: some(kapp),
  }
  return makeWaypoint(value, [])
}

const byHuffmanWeight = ord.contramap(
  ordNumber,
  (hw: Waypoint): number => hw.value.huffmanWeight
)
const sortByHuffmanWeight = sortBy([byHuffmanWeight])

const forestWeight: (forest: Destinations) => number = foldLeft(
  (): number => 0,
  (head, tail): number => head.value.huffmanWeight + forestWeight(tail)
)
export function mAryHuffmanTreeBuilder(
  m: number
): (xs: NonEmptyArray<Waypoint>) => Waypoint {
  return function treeFromNonEmptyArrayOfTrees(
    xs: NonEmptyArray<Waypoint>
  ): Waypoint {
    let result: Waypoint

    if (xs.length === 1) {
      result = head(xs)
    } else {
      const modM = xs.length % m
      const takeN = modM === 0 ? m : modM + 1
      const [forest, tail] = splitAt(takeN)(sortByHuffmanWeight(xs))

      const tree = makeWaypoint(
        { huffmanWeight: forestWeight(forest), kapp: none, parent: none },
        forest
      )
      result = treeFromNonEmptyArrayOfTrees(cons(tree, tail))
    }
    return result
  }
}

interface NewHuffmanRootParams {
  appActionLog: AppAction[]
  width?: number
  kapps?: Kapp[]
}

export function newHuffmanRoot({
  appActionLog,
  width = allKeyswitches.length - 2,
  kapps = userlandKapps,
}: NewHuffmanRootParams): Waypoint {
  const huffmanOrphanLeaves = map(
    (kapp: Kapp): Waypoint => makeOrphanLeafWaypoint(appActionLog, kapp)
  )(kapps)
  const huffmanTreeBuilder = mAryHuffmanTreeBuilder(width)
  let huffmanRoot
  if (isNonEmpty(huffmanOrphanLeaves)) {
    huffmanRoot = huffmanTreeBuilder(huffmanOrphanLeaves)
  } else {
    throw new Error('Could not find any Kapps')
  }
  return huffmanRoot
}

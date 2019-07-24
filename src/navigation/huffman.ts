import {
  foldLeft,
  getMonoid,
  map,
  sortBy,
  splitAt,
  isNonEmpty,
} from 'fp-ts/es6/Array'
import { cons, head, NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import { fold, none, some } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { foldMap, make } from 'fp-ts/es6/Tree'
import { Kapp, Waypoint, WaypointValue } from '../types'
import { allKapps } from '../commands'
import { allKeyswitches } from '../constants'

export interface HuffmanWeighted {
  huffmanWeight: number
}

const byActuationCountDesc = ord.contramap(
  ordNumber,
  (kapp: Kapp): number => -kapp.actuationCount
)
const sortByActuationCount = sortBy([byActuationCountDesc])

export function reachableKapps(waypoint: Waypoint): Kapp[] {
  const M = getMonoid<Kapp>()
  const kapps = sortByActuationCount(
    foldMap(M)((waypointValue: WaypointValue): Kapp[] =>
      fold((): Kapp[] => [], (kapp: Kapp): Kapp[] => [kapp])(
        waypointValue.kapp
      )
    )(waypoint)
  )
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

export function makeOrphanLeafWaypoint(kapp: Kapp): Waypoint {
  const value = {
    huffmanWeight: kapp.actuationCount,
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

export function newHuffmanRoot(
  width: number = allKeyswitches.length - 2,
  kapps: Kapp[] = allKapps
): Waypoint {
  const huffmanOrphanLeaves = map(makeOrphanLeafWaypoint)(kapps)
  const huffmanTreeBuilder = mAryHuffmanTreeBuilder(width)
  let huffmanRoot
  if (isNonEmpty(huffmanOrphanLeaves)) {
    huffmanRoot = huffmanTreeBuilder(huffmanOrphanLeaves)
  } else {
    throw new Error('Could not find any Kapps')
  }
  return huffmanRoot
}

import { foldLeft, getMonoid, map, sortBy, splitAt } from 'fp-ts/es6/Array'
import { cons, head, NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import { fold, none, some } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { foldMap, make } from 'fp-ts/es6/Tree'
import { Kapp, Waypoint, WaypointValue } from '../types'

export interface HuffmanWeighted {
  huffmanWeight: number
}

export function reachableKapps(waypoint: Waypoint): Kapp[] {
  const M = getMonoid<Kapp>()
  const kapps = foldMap(M)((waypointValue: WaypointValue): Kapp[] =>
    fold((): Kapp[] => [], (kapp: Kapp): Kapp[] => [kapp])(waypointValue.kapp)
  )(waypoint)
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

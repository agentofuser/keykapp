import {
  foldLeft,
  foldMap as foldMapArray,
  getMonoid,
  isNonEmpty,
  map,
  mapWithIndex,
  reduce,
  sortBy,
  splitAt,
} from 'fp-ts/es6/Array'
import { cons, head, NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import { fold, fromNullable } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { foldMap as foldMapTree, make } from 'fp-ts/es6/Tree'
import {
  allKeyswitches,
  asciiIdv0Path,
  manualWeights,
  nGramRange,
} from '../constants'
import { charCounts } from '../datasets/tweet'
import { getKappById } from '../kapps'
import { sumReducer } from '../kitchensink/purefns'
import { AppState, Kapp, Waypoint, WaypointValue } from '../types'

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

function tailKGram(k: number, state: AppState, kapp: Kapp): string {
  const { length } = state.tempRoot.kappIdv0Log
  const logTail = state.tempRoot.kappIdv0Log.slice(length - k + 1, length)
  logTail.push(kapp.idv0)
  const kGram = logTail.join('\n')
  return kGram
}

function tailSequenceFrequencies(state: AppState, kapp: Kapp): number[] {
  const tailKGrams = map((k: number): string => tailKGram(k, state, kapp))(
    nGramRange
  )
  return tailKGrams.map((kGram: string): number => {
    const frequency = state.tempRoot.sequenceFrequencies[kGram] || 0
    return frequency
  })
}

function huffmanWeightFromKapp(state: AppState | null, kapp: Kapp): number {
  const idv0 = kapp.idv0
  let manualWeight = 0
  let twitterCount = kappTwitterCount(kapp)
  let sequenceCounts = state ? tailSequenceFrequencies(state, kapp) : []

  if (!idv0.match(asciiIdv0Path)) {
    manualWeight = manualWeights[idv0] || 1
  }

  const sequenceWeight = reduce(0, sumReducer)(
    mapWithIndex((i, n: number): number => n * 10 ** (i + 2))(sequenceCounts)
  )

  const finalWeight = twitterCount + manualWeight + sequenceWeight

  return finalWeight
}

type WaypointSorter = (as: Waypoint[]) => Waypoint[]
const sortByHuffmanWeightAsc = ((): WaypointSorter => {
  const byHuffmanWeight = ord.contramap(
    ordNumber,
    (waypoint: Waypoint): number => waypoint.value.huffmanWeight
  )
  return sortBy([byHuffmanWeight])
})()

type LeafLister = (as: Waypoint) => Waypoint[]

export function reachableKapps(waypoint: Waypoint): Kapp[] {
  const byHuffmanWeightDesc = ord.contramap(
    ordNumber,
    (waypointValue: WaypointValue): number => -waypointValue.huffmanWeight
  )
  const sortByHuffmanWeightDesc = sortBy([byHuffmanWeightDesc])

  const waypointValueM = getMonoid<WaypointValue>()
  const sortedKappWaypointValues: WaypointValue[] = sortByHuffmanWeightDesc(
    foldMapTree(waypointValueM)(
      (waypointValue: WaypointValue): WaypointValue[] => {
        const kappWaypointValue = fold(
          (): WaypointValue[] => [],
          (_kappIdv0: string): WaypointValue[] => [waypointValue]
        )(fromNullable(waypointValue.kappIdv0))
        return kappWaypointValue
      }
    )(waypoint)
  )

  const kappM = getMonoid<Kapp>()
  const kapps = foldMapArray(kappM)((waypointValue: WaypointValue): Kapp[] =>
    fold(
      (): Kapp[] => [],
      (kappIdv0: string): Kapp[] => [getKappById(kappIdv0)]
    )(fromNullable(waypointValue.kappIdv0))
  )(sortedKappWaypointValues)
  return kapps
}

export function makeOrphanLeafWaypoint(
  state: AppState | null,
  kapp: Kapp
): Waypoint {
  const value = {
    huffmanWeight: huffmanWeightFromKapp(state, kapp),
    kappIdv0: kapp.idv0,
  }
  return make(value, [])
}

const forestWeight: (forest: Waypoint[]) => number = foldLeft(
  (): number => 0,
  (head, tail): number => head.value.huffmanWeight + forestWeight(tail)
)
export function mAryHuffmanTreeBuilder(
  m: number
): (xs: NonEmptyArray<Waypoint>) => Waypoint {
  return function treeFromNonEmptyArrayOfTrees(
    xs: NonEmptyArray<Waypoint>
  ): Waypoint {
    // This crucial part taken from
    // https://github.com/lydell/n-ary-huffman/blob/master/index.coffee
    // ###
    // Copyright 2014, 2015, 2016 Simon Lydell
    // X11 (“MIT”) Licensed. (See LICENSE.)
    //
    // A `numBranches`-ary tree can be formed by `1 + (numBranches - 1) * n`
    // elements: There is the root of the tree (`1`), and each branch point adds
    // `numBranches` elements to the total number or elements, but replaces itself
    // (`numBranches - 1`). `n` is the number of points where the tree branches
    // (therefore, `n` is an integer). In order to create the tree using
    // `numElements` elements, we need to find the smallest `n` such that `1 +
    // (numBranches - 1) * n == numElements + padding`. We need to add `padding`
    // since `n` is an integer and there might not be an integer `n` that makes
    // the left-hand side equal to `numElements`. Solving for `padding` gives
    // `padding = 1 + (numBranches - 1) * n - numElements`. Since `padding >= 0`
    // (we won’t reduce the number of elements, only add extra dummy ones), it
    // follows that `n >= (numElements - 1) / (numBranches - 1)`. The smallest
    // integer `n = numBranchPoints` is then:
    const numElements = xs.length
    const numBranches = m
    const numBranchPoints = Math.ceil((numElements - 1) / (numBranches - 1))
    // The above gives the padding:
    const numPadding = 1 + (numBranches - 1) * numBranchPoints - numElements

    let result: Waypoint

    if (xs.length === 1) {
      result = head(xs)
    } else {
      const takeN = numPadding > 0 ? numBranches - numPadding : numBranches
      const [forest, tail] = splitAt(takeN)(sortByHuffmanWeightAsc(xs))

      const tree = make(
        {
          huffmanWeight: forestWeight(forest),
          kappIdv0: null,
        },
        forest
      )
      result = treeFromNonEmptyArrayOfTrees(cons(tree, tail))
    }
    return result
  }
}

interface NewHuffmanRootParams {
  state?: AppState | null
  width?: number
  kapps: Kapp[]
}

export function newHuffmanRoot({
  state = null,
  // subtract one to leave a keyswitch for system kapps
  width = allKeyswitches.length - 1,
  kapps,
}: NewHuffmanRootParams): Waypoint {
  const huffmanOrphanLeaves = map(
    (kapp: Kapp): Waypoint => makeOrphanLeafWaypoint(state, kapp)
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

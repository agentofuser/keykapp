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
import { fold, fromNullable } from 'fp-ts/es6/Option'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { foldMap as foldMapTree, make } from 'fp-ts/es6/Tree'
import { allKeyswitches, asciiIdv0Path, manualWeights } from '../constants'
import { charCounts } from '../datasets/tweet'
import { getKappById, userlandKapps } from '../kapps'
import { kappLog } from '../state'
import {
  AppAction,
  AppActionLog,
  Kapp,
  Waypoint,
  WaypointValue,
} from '../types'

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
    manualWeight = manualWeights[idv0] || 1
  }

  const finalWeight = twitterCount + manualWeight + logCount

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
  appActionLog: AppAction[],
  kapp: Kapp
): Waypoint {
  const value = {
    huffmanWeight: huffmanWeightFromKapp(appActionLog, kapp),
    kappIdv0: kapp.idv0,
  }
  return make(value, [])
}

const forestWeight: (forest: Waypoint[]) => number = foldLeft(
  (): number => 0,
  (head, tail): number => head.value.huffmanWeight + forestWeight(tail)
)
export function mAryHuffmanTreeBuilder(
  appActionLog: AppActionLog,
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
  appActionLog: AppActionLog
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
  const huffmanTreeBuilder = mAryHuffmanTreeBuilder(appActionLog, width)
  let huffmanRoot
  if (isNonEmpty(huffmanOrphanLeaves)) {
    huffmanRoot = huffmanTreeBuilder(huffmanOrphanLeaves)
  } else {
    throw new Error('Could not find any Kapps')
  }
  return huffmanRoot
}

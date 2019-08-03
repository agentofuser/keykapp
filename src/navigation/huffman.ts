import {
  filter,
  foldLeft,
  isNonEmpty,
  map,
  sortBy,
  splitAt,
} from 'fp-ts/es6/Array'
import { eqString } from 'fp-ts/es6/Eq'
import { cons, head, NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { fromArray, union } from 'fp-ts/es6/Set'
import { make } from 'fp-ts/es6/Tree'
import { allKeyswitches, asciiIdv0Path } from '../constants'
import { charCounts } from '../datasets/tweet'
import { getKappById, userlandKapps } from '../kapps'
import { kappLog } from '../state'
import { AppAction, AppActionLog, Kapp, Waypoint } from '../types'

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

export function reachableKapps(waypoint: Waypoint): Kapp[] {
  const ids = waypoint.value.reachableKappIdsv0
  const kapps: Kapp[] = map(getKappById)(Array.from(ids))
  return kapps
}

export function makeOrphanLeafWaypoint(
  appActionLog: AppAction[],
  kapp: Kapp
): Waypoint {
  const value = {
    huffmanWeight: huffmanWeightFromKapp(appActionLog, kapp),
    reachableKappIdsv0: fromArray(eqString)([kapp.idv0]),
  }
  return make(value, [])
}

const byHuffmanWeight = ord.contramap(
  ordNumber,
  (hw: Waypoint): number => hw.value.huffmanWeight
)
const sortByHuffmanWeight = sortBy([byHuffmanWeight])

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
      const [forest, tail] = splitAt(takeN)(sortByHuffmanWeight(xs))

      const sets: Set<string>[] = map(
        (waypoint: Waypoint): Set<string> => waypoint.value.reachableKappIdsv0
      )(forest)
      const unsortedReachableKappIdsv0 = sets.reduce(
        (idSetUnion: Set<string>, idSet: Set<string>): Set<string> =>
          union(eqString)(idSetUnion, idSet),
        fromArray(eqString)([])
      )

      const reachableKappIdsv0 = new Set(
        Array.from(unsortedReachableKappIdsv0).sort(
          (a: string, b: string): number => {
            const kappA = getKappById(a)
            const kappB = getKappById(b)
            return (
              huffmanWeightFromKapp(appActionLog, kappB) -
              huffmanWeightFromKapp(appActionLog, kappA)
            )
          }
        )
      )

      const tree = make(
        {
          huffmanWeight: forestWeight(forest),
          reachableKappIdsv0,
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

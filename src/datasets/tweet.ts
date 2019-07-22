import { filter, map } from 'fp-ts/es6/Array'
import { flow } from 'fp-ts/es6/function'
import { tweets } from '../../private/tweets'

const joinedOwnTweets: string = flow(
  map(
    ({ full_text: fullText, ..._others }: { full_text: string }): string =>
      fullText
  ),
  filter((fullText: string): boolean => !fullText.startsWith('RT @'))
)(tweets).join('')

// eslint-disable-next-line
export const charCounts = joinedOwnTweets
  // .replace(/[^ \n:"'`.,#A-Za-z0-9?!@]/g, '')
  .split('')
  .reduce(
    (counts: any, char: string): any => {
      if (counts[char]) {
        counts[char] = counts[char] + 1
      } else {
        counts[char] = 1
      }
      return counts
    },
    {} as any
  )

// const countPairs = Object.entries(charCounts)
// const sortedCountPairs = countPairs.sort(
//   ([charA, countA], [charB, countB]) => countB - countA
// )

// function entriesToObject(arr) {
//   return Object.assign(...arr.map(([key, val]) => ({ [key]: val })))
// }

// export const charCounts = entriesToObject(sortedCountPairs)

// console.log(JSON.stringify(sortedCountPairs, null, 2))

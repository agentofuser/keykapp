import { foldLeft, sortBy, splitAt } from 'fp-ts/es6/Array'
import { head, NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import { ord, ordNumber } from 'fp-ts/es6/Ord'
import { Forest, make, Tree } from 'fp-ts/es6/Tree'

export interface HuffmanWeighted {
  huffmanWeight: number
}

export type HuffmanTree = Tree<HuffmanWeighted>
export type HuffmanForest = Forest<HuffmanWeighted>

// function forestOfLeaves(): NonEmptyArray<HuffmanTree> {
//   return map(make)(
//     cons({ huffmanWeight: 8 }, [
//       { huffmanWeight: 4 },
//       { huffmanWeight: 2 },
//       { huffmanWeight: 1 },
//       { huffmanWeight: 0 },
//       { huffmanWeight: 32 },
//       { huffmanWeight: 16 },
//     ])
//   )
// }

const byHuffmanWeight = ord.contramap(
  ordNumber,
  (hw: HuffmanTree): number => hw.value.huffmanWeight
)
const sortByHuffmanWeight = sortBy([byHuffmanWeight])

const forestWeight: (forest: HuffmanForest) => number = foldLeft(
  (): number => 0,
  (head, tail): number => head.value.huffmanWeight + forestWeight(tail)
)
export function mAryHuffmanTreeBuilder(
  m: number
): (xs: NonEmptyArray<HuffmanTree>) => HuffmanTree {
  return function treeFromNonEmptyArrayOfTrees(
    xs: NonEmptyArray<HuffmanTree>
  ): HuffmanTree {
    let result: HuffmanTree

    if (xs.length === 1) {
      result = head(xs)
    } else {
      const [forest, tail] = splitAt(m)(sortByHuffmanWeight(xs))

      const tree = make({ huffmanWeight: forestWeight(forest) }, forest)
      result = treeFromNonEmptyArrayOfTrees([tree, ...tail])
    }
    return result
  }
}

// export function test(): void {
//   const leaves = forestOfLeaves()
//   const tree = flow(mAryHuffmanTreeBuilder(4))(leaves)
//   console.log(JSON.stringify(tree, null, 2))

//   // drawTree(treeFromForest(leaves))
// }

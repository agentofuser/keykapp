export function wordCount(str: string): number {
  const matches = str.match(/\S+/g)
  return matches ? matches.length : 0
}

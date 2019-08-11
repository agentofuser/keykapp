export function wordCount(str: string): number {
  const matches = str.match(/\S+/g)
  return matches ? matches.length : 0
}

export function stringClamper(maxLength: number): (str: string) => string {
  return function clampString(str: string): string {
    if (str.length > maxLength) {
      const clamped = str
        .slice(0, maxLength)
        .split(' ')
        .slice(0, -1)
        .join(' ')
      return clamped + '…'
    } else {
      return str
    }
  }
}

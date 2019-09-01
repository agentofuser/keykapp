export function wordCount(str: string): number {
  const matches = str.match(/\S+/g)
  return matches ? matches.length : 0
}

// clamps at the last whitespace boundary, so the returned string can be
// shorter than maxLength
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

export const sumReducer = (sum: number, element: number): number =>
  sum + element

// Parse string with value in pixels
export function parsePx(str: string): number {
  return parseFloat(str.replace(/[^\d.]/g, ''))
}

export function sizeInBytes(string: string): number {
  return new Blob([string]).size
}

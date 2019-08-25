export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout((): void => {
      resolve()
    }, ms)
  })
}

// from https://stackoverflow.com/a/1955160/11343832
export function getStyle(el: any, styleProp: string): string {
  var camelize = function(str: string): string {
    return str.replace(/\-(\w)/g, function(str, letter): string {
      return letter.toUpperCase()
    })
  }

  if (el.currentStyle) {
    return el.currentStyle[camelize(styleProp)]
  } else if (document.defaultView && document.defaultView.getComputedStyle) {
    return document.defaultView
      .getComputedStyle(el, null)
      .getPropertyValue(styleProp)
  } else {
    return el.style[camelize(styleProp)]
  }
}

export function logDev(serializable: any): void {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.info(JSON.stringify(serializable, null, 2))
  }
}

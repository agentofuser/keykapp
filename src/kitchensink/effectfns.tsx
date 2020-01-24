import { saveAs } from 'file-saver'

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout((): void => {
      resolve()
    }, ms)
  })
}

// from https://stackoverflow.com/a/1955160/11343832
export function getStyle(el: any, styleProp: string): string {
  const camelize = function(str: string): string {
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

export function ifDevelopment(task: () => any): any {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return task()
  }
}

export function devStringifyAndLog(serializable: any): void {
  ifDevelopment(() => console.info(JSON.stringify(serializable, null, 2)))
}

export function devLog(serializable: any): void {
  ifDevelopment(() => console.info(serializable))
}

function data2blob(data: string, isBase64 = false): Blob {
  let chars = ''

  if (isBase64) chars = atob(data)
  else chars = data

  const bytes = new Array(chars.length)
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i)
  }

  const blob = new Blob([new Uint8Array(bytes)])
  return blob
}

export function stringSaveAs(string: string, suggestedFilename: string): void {
  saveAs(data2blob(string), suggestedFilename)
}

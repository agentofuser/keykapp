export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout((): void => {
      resolve()
    }, ms)
  })
}

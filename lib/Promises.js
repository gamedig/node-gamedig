export default class Promises {
  static createTimeout (timeoutMs, timeoutMsg) {
    let cancel = null
    const wrapped = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          reject(new Error(timeoutMsg + ' - Timed out after ' + timeoutMs + 'ms'))
        },
        timeoutMs
      )
      cancel = () => {
        clearTimeout(timeout)
      }
    })
    wrapped.cancel = cancel
    return wrapped
  }
}

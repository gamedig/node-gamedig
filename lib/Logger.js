import { debugDump } from './HexUtil.js'
import { Buffer } from 'node:buffer'

export default class Logger {
  constructor () {
    this.debugEnabled = false
    this.prefix = ''
  }

  debug (...args) {
    if (!this.debugEnabled) return
    this._print(...args)
  }

  _print (...args) {
    try {
      const strings = this._convertArgsToStrings(...args)
      if (strings.length) {
        if (this.prefix) {
          strings.unshift(this.prefix)
        }
        console.log(...strings)
      }
    } catch (e) {
      console.log('Error while logging: ' + e)
    }
  }

  _convertArgsToStrings (...args) {
    const out = []
    for (const arg of args) {
      if (arg instanceof Error) {
        out.push(arg.stack)
      } else if (arg instanceof Buffer) {
        out.push(debugDump(arg))
      } else if (typeof arg === 'function') {
        const result = arg.call(undefined, (...args) => this._print(...args))
        if (result !== undefined) out.push(...this._convertArgsToStrings(result))
      } else {
        out.push(arg)
      }
    }
    return out
  }
}

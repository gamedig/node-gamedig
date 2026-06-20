export class Player {
  name = ''
  raw = {}

  constructor (data) {
    if (typeof data === 'string') {
      this.name = data
    } else {
      const { name, ...raw } = data
      if (name) this.name = name
      if (raw) this.raw = raw
    }
  }
}

export class Players extends Array {
  push (data) {
    super.push(new Player(data))
  }
}

export class Results {
  name = ''
  map = ''
  password = false

  raw = {}
  version = ''

  maxplayers = 0
  numplayers = 0
  players = new Players()
  bots = new Players()

  queryPort = 0
}

/**
 * Recursively convert a query result into plain JS objects/arrays.
 *
 * The typed wrappers (Results, Players, Player) extend Object/Array, which
 * makes them awkward to JSON serialize, structuredClone, deep-clone or compare.
 * This strips those prototypes, returning only plain objects and arrays while
 * leaving primitives and structuredClone-friendly values (Buffer, Date) intact.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function toPlainObject (value) {
  if (Array.isArray(value)) {
    // Array.from() always yields a plain Array, even for subclasses like Players
    // (whose .map() would otherwise return another Players instance).
    return Array.from(value, toPlainObject)
  }
  if (value !== null && typeof value === 'object') {
    // Leave already clone-friendly objects untouched rather than flattening them.
    if (Buffer.isBuffer(value) || value instanceof Date) {
      return value
    }
    const out = {}
    for (const key of Object.keys(value)) {
      out[key] = toPlainObject(value[key])
    }
    return out
  }
  return value
}

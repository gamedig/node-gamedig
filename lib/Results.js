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

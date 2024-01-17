import { lookup } from './game-resolver.js'
import { getProtocol } from './ProtocolResolver.js'
import GlobalUdpSocket from './GlobalUdpSocket.js'

const defaultOptions = {
  socketTimeout: 2000,
  attemptTimeout: 10000,
  maxAttempts: 1,
  stripColors: true,
  ipFamily: 0
}

export default class QueryRunner {
  constructor (runnerOpts = {}) {
    this.udpSocket = new GlobalUdpSocket({
      port: runnerOpts.listenUdpPort
    })
  }

  async run (userOptions) {
    for (const key of Object.keys(userOptions)) {
      const value = userOptions[key]
      if (['port', 'ipFamily'].includes(key)) {
        userOptions[key] = parseInt(value)
      }
    }

    const {
      port_query: gameQueryPort,
      port_query_offset: gameQueryPortOffset,
      ...gameOptions
    } = lookup(userOptions.type)
    const attempts = []

    const optionsCollection = {
      ...defaultOptions,
      ...gameOptions,
      ...userOptions
    }

    const addAttemptWithPort = port => {
      attempts.push({
        ...optionsCollection,
        port
      })
    }

    let portOffsetArray = gameQueryPortOffset
    if (!Array.isArray(portOffsetArray)) {
      gameQueryPortOffset ? portOffsetArray = [gameQueryPortOffset] : portOffsetArray = [0]
    }

    if (userOptions.port) {
      if (!userOptions.givenPortOnly) {
        portOffsetArray.forEach((portOffset) => { addAttemptWithPort(userOptions.port + portOffset) })
        if (userOptions.port === gameOptions.port && gameQueryPort) { addAttemptWithPort(gameQueryPort) }
      }
      attempts.push(optionsCollection)
    } else if (gameQueryPort) {
      addAttemptWithPort(gameQueryPort)
    } else if (gameOptions.port) {
      portOffsetArray.forEach((portOffset) => { addAttemptWithPort(gameOptions.port + portOffset) })
    } else {
      // Hopefully the request doesn't need a port. If it does, it'll fail when making the request.
      attempts.push(optionsCollection)
    }

    const numRetries = userOptions.maxAttempts || gameOptions.maxAttempts || defaultOptions.maxAttempts

    let attemptNum = 0
    const errors = []
    for (const attempt of attempts) {
      for (let retry = 0; retry < numRetries; retry++) {
        attemptNum++

        try {
          return await this._attempt(attempt)
        } catch (e) {
          e.stack = 'Attempt #' + attemptNum + ' - Port=' + attempt.port + ' Retry=' + (retry) + ':\n' + e.stack
          errors.push(e)
        }
      }
    }

    const err = new Error('Failed all ' + errors.length + ' attempts')
    for (const e of errors) {
      err.stack += '\n' + e.stack
    }

    throw err
  }

  async _attempt (options) {
    const core = getProtocol(options.protocol)
    core.options = options
    core.udpSocket = this.udpSocket
    return await core.runOnceSafe()
  }
}

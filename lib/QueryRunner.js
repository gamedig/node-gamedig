import { lookup } from './game-resolver.js'
import { getProtocol } from './ProtocolResolver.js'
import GlobalUdpSocket from './GlobalUdpSocket.js'

const defaultOptions = {
  socketTimeout: 2000,
  attemptTimeout: 10000,
  maxRetries: 1,
  stripColors: true,
  portCache: true,
  noBreadthOrder: false,
  ipFamily: 0,
  requestPlayers: true
}

export default class QueryRunner {
  constructor (runnerOpts = {}) {
    this.udpSocket = new GlobalUdpSocket({
      port: runnerOpts.listenUdpPort
    })
    this.portCache = {}
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
    } = lookup(userOptions)
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

    const cachedPort = this.portCache[`${userOptions.address}:${userOptions.port}`]

    // Use any cached port if port caching is enabled and user is not explicitly enforcing their given port
    if (cachedPort && optionsCollection.portCache && !userOptions.givenPortOnly) {
      addAttemptWithPort(cachedPort)
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

    const numRetries = userOptions.maxRetries || gameOptions.maxRetries || defaultOptions.maxRetries

    const retries = Array.from({ length: numRetries }, (x, i) => i)

    const attemptOrder = []
    if (optionsCollection.noBreadthOrder) {
      attempts.forEach(attempt => retries.forEach(retry => attemptOrder.push({ attempt, retry })))
    } else {
      retries.forEach(retry => attempts.forEach(attempt => attemptOrder.push({ attempt, retry })))
    }

    let attemptNum = 0
    const errors = []
    for (const { attempt, retry } of attemptOrder) {
      attemptNum++

      try {
        const response = await this._attempt(attempt)
        if (attempt.portCache) {
          this.portCache[`${userOptions.address}:${userOptions.port}`] = attempt.port
        }
        return response
      } catch (e) {
        e.stack = 'Attempt #' + attemptNum + ' - Port=' + attempt.port + ' Retry=' + (retry) + ':\n' + e.stack
        errors.push(e)
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

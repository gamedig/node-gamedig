import Core from '../../protocols/core.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BINARY_DIR = path.join(__dirname, 'fixtures', 'binary')

let originalUdpSend
let originalTcpSend

/**
 * Load binary fixture for a test case
 */
export function loadBinaryFixture (name) {
  const fixtureDir = path.join(BINARY_DIR, name)

  if (!fs.existsSync(fixtureDir)) {
    throw new Error(`Binary fixture not found: ${name}`)
  }

  const fixture = {
    name,
    udp: [],
    tcp: [],
    result: null,
    error: null,
    meta: null
  }

  // Load metadata
  const metaPath = path.join(fixtureDir, 'meta.json')
  if (fs.existsSync(metaPath)) {
    fixture.meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  }

  // Load result
  const resultPath = path.join(fixtureDir, 'result.json')
  if (fs.existsSync(resultPath)) {
    fixture.result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
  }

  // Load error
  const errorPath = path.join(fixtureDir, 'error.json')
  if (fs.existsSync(errorPath)) {
    fixture.error = JSON.parse(fs.readFileSync(errorPath, 'utf8'))
  }

  // Load UDP packets
  let udpIndex = 0
  while (true) {
    const reqPath = path.join(fixtureDir, `udp-req-${udpIndex}.bin`)
    const resPath = path.join(fixtureDir, `udp-res-${udpIndex}.bin`)

    if (!fs.existsSync(reqPath) || !fs.existsSync(resPath)) break

    fixture.udp.push({
      request: fs.readFileSync(reqPath),
      response: fs.readFileSync(resPath)
    })
    udpIndex++
  }

  // Load TCP packets
  // Note: We capture multiple chunks as TCP streams are read.
  // Only use the last (complete) packet for each request/response pair.
  const tcpPackets = []
  let tcpIndex = 0
  while (true) {
    const reqPath = path.join(fixtureDir, `tcp-req-${tcpIndex}.bin`)
    const resPath = path.join(fixtureDir, `tcp-res-${tcpIndex}.bin`)

    if (!fs.existsSync(reqPath) || !fs.existsSync(resPath)) break

    tcpPackets.push({
      request: fs.readFileSync(reqPath),
      response: fs.readFileSync(resPath)
    })
    tcpIndex++
  }

  // Use only the last (largest) packet which contains the complete response
  if (tcpPackets.length > 0) {
    fixture.tcp.push(tcpPackets[tcpPackets.length - 1])
  }

  return fixture
}

/**
 * Mock UDP/TCP to replay binary responses
 */
export function mockSocketsWithFixture (fixture) {
  let udpCallIndex = 0
  let tcpCallIndex = 0

  // Mock UDP socket
  Core.prototype.udpSend = async function (buffer, onPacket, onTimeout) {
    if (!onPacket) {
      return originalUdpSend.call(this, buffer, onPacket, onTimeout)
    }

    const packet = fixture.udp[udpCallIndex++]

    if (!packet) {
      if (onTimeout) {
        const result = onTimeout()
        if (result !== undefined) return result
      }
      throw new Error('UDP timeout')
    }

    return onPacket(packet.response)
  }

  // Mock TCP socket
  Core.prototype.tcpSend = async function (socket, buffer, onResponse) {
    if (!onResponse) {
      return originalTcpSend.call(this, socket, buffer, onResponse)
    }

    const packet = fixture.tcp[tcpCallIndex++]

    if (!packet) {
      throw new Error('TCP - No fixture response available')
    }

    return onResponse(packet.response)
  }
}

/**
 * Setup mocking (call in beforeEach)
 */
export function setupMocking () {
  originalUdpSend = Core.prototype.udpSend
  originalTcpSend = Core.prototype.tcpSend
}

/**
 * Restore original methods (call in afterEach)
 */
export function restoreMocking () {
  Core.prototype.udpSend = originalUdpSend
  Core.prototype.tcpSend = originalTcpSend
}

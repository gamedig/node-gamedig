#!/usr/bin/env node

/**
 * Binary Response Capture Utility
 *
 * Captures raw UDP/TCP binary responses from game servers by patching
 * the socket layer. Saves responses as .bin files for replay in tests.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { GameDig } from '../../lib/index.js'
import Core from '../../protocols/core.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BINARY_DIR = path.join(__dirname, 'fixtures', 'binary')

// Storage for captured binary responses
const captures = new Map()

// Patch Core.udpSend to capture UDP requests and responses
const originalUdpSend = Core.prototype.udpSend
Core.prototype.udpSend = async function (buffer, onPacket, onTimeout) {
  const captureName = this.options._captureName

  if (captureName) {
    // Initialize capture storage
    if (!captures.has(captureName)) {
      captures.set(captureName, { udp: [], tcp: [], udpRequests: [], tcpRequests: [] })
    }

    // Always save the request (even if it times out)
    captures.get(captureName).udpRequests.push(Buffer.from(buffer))
    console.log(`  📤 Sent UDP request (${buffer.length} bytes)`)

    if (onPacket) {
      // Wrap the onPacket callback to capture the response
      const originalOnPacket = onPacket
      onPacket = (responseBuffer) => {
        // Save the binary response
        captures.get(captureName).udp.push({
          request: Buffer.from(buffer),
          response: Buffer.from(responseBuffer)
        })

        console.log(`  📦 Captured UDP response (${responseBuffer.length} bytes)`)

        return originalOnPacket(responseBuffer)
      }
    }
  }

  return originalUdpSend.call(this, buffer, onPacket, onTimeout)
}

// Patch Core.tcpSend to capture TCP requests and responses
const originalTcpSend = Core.prototype.tcpSend
Core.prototype.tcpSend = async function (socket, buffer, onResponse) {
  const captureName = this.options._captureName

  if (captureName) {
    // Initialize capture storage
    if (!captures.has(captureName)) {
      captures.set(captureName, { udp: [], tcp: [], udpRequests: [], tcpRequests: [] })
    }

    // Always save the request (even if it times out)
    captures.get(captureName).tcpRequests.push(Buffer.from(buffer))
    console.log(`  📤 Sent TCP request (${buffer.length} bytes)`)

    if (onResponse) {
      // Wrap the onResponse callback to capture
      const originalOnResponse = onResponse
      onResponse = (responseBuffer) => {
        // Save the binary response
        captures.get(captureName).tcp.push({
          request: Buffer.from(buffer),
          response: Buffer.from(responseBuffer)
        })

        console.log(`  📦 Captured TCP response (${responseBuffer.length} bytes)`)

        return originalOnResponse(responseBuffer)
      }
    }
  }

  return originalTcpSend.call(this, socket, buffer, onResponse)
}

// Capture targets
const TARGETS = [
  {
    name: 'hypixel-without-port',
    query: { type: 'minecraft', host: 'hypixel.net', _captureName: 'hypixel-without-port' },
    description: 'Hypixel without port (default 25565)'
  },
  {
    name: 'hypixel-with-port',
    query: { type: 'minecraft', host: 'hypixel.net', port: 25565, _captureName: 'hypixel-with-port' },
    description: 'Hypixel with port 25565'
  },
  {
    name: 'sopelmc-without-port',
    query: { type: 'minecraft', host: 'sopelmc.pl', _captureName: 'sopelmc-without-port' },
    description: 'sopelmc.pl without port (should fail - wrong port)',
    expectError: true
  },
  {
    name: 'sopelmc-with-port',
    query: { type: 'minecraft', host: 'sopelmc.pl', port: 26420, _captureName: 'sopelmc-with-port' },
    description: 'sopelmc.pl with port 26420 (correct port)'
  }
]

async function captureServer (target) {
  console.log(`\n🎯 Capturing: ${target.description}`)
  console.log(`   Query:`, { type: target.query.type, host: target.query.host, port: target.query.port })

  try {
    const result = await GameDig.query(target.query)

    console.log(`   ✅ Success: ${result.name}`)
    console.log(`   👥 Players: ${result.numplayers}/${result.maxplayers}`)

    // Save captured binary data
    const capture = captures.get(target.name)
    if (capture) {
      saveBinaryCapture(target.name, capture)

      // Also save the JSON result for reference
      const captureDir = path.join(BINARY_DIR, target.name)
      const jsonPath = path.join(captureDir, 'result.json')
      fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2))
    } else {
      console.log(`   ⚠️  No binary data captured`)
    }
  } catch (error) {
    if (target.expectError) {
      console.log(`   ⚠️  Expected error: ${error.message}`)
    } else {
      console.error(`   ❌ Unexpected error:`, error.message)
    }

    // Always save captured data even on error (requests sent, even if no responses)
    const capture = captures.get(target.name)
    const hasData = capture && (
      capture.udp.length > 0 ||
      capture.tcp.length > 0 ||
      (capture.udpRequests && capture.udpRequests.length > 0) ||
      (capture.tcpRequests && capture.tcpRequests.length > 0)
    )

    if (hasData) {
      saveBinaryCapture(target.name, capture)
    } else {
      // Create empty capture dir with error info
      const captureDir = path.join(BINARY_DIR, target.name)
      fs.mkdirSync(captureDir, { recursive: true })
      console.log(`   ⚠️  No packets captured at all`)
    }

    // Always save error info
    const captureDir = path.join(BINARY_DIR, target.name)
    const errorPath = path.join(captureDir, 'error.json')
    fs.writeFileSync(errorPath, JSON.stringify({
      error: error.message,
      stack: error.stack,
      capturedAt: new Date().toISOString()
    }, null, 2))
  }
}

function saveBinaryCapture (name, capture) {
  // Create folder for this capture
  const captureDir = path.join(BINARY_DIR, name)
  fs.mkdirSync(captureDir, { recursive: true })

  // Save UDP request/response pairs
  capture.udp.forEach((packet, index) => {
    const reqPath = path.join(captureDir, `udp-req-${index}.bin`)
    const resPath = path.join(captureDir, `udp-res-${index}.bin`)
    fs.writeFileSync(reqPath, packet.request)
    fs.writeFileSync(resPath, packet.response)
    console.log(`   💾 UDP #${index}: req=${packet.request.length}B, res=${packet.response.length}B`)
  })

  // Save TCP request/response pairs
  capture.tcp.forEach((packet, index) => {
    const reqPath = path.join(captureDir, `tcp-req-${index}.bin`)
    const resPath = path.join(captureDir, `tcp-res-${index}.bin`)
    fs.writeFileSync(reqPath, packet.request)
    fs.writeFileSync(resPath, packet.response)
    console.log(`   💾 TCP #${index}: req=${packet.request.length}B, res=${packet.response.length}B`)
  })

  // Save standalone requests (sent but got no response - timeouts)
  if (capture.udpRequests && capture.udpRequests.length > capture.udp.length) {
    const startIndex = capture.udp.length
    for (let i = startIndex; i < capture.udpRequests.length; i++) {
      const reqPath = path.join(captureDir, `udp-req-timeout-${i}.bin`)
      fs.writeFileSync(reqPath, capture.udpRequests[i])
      console.log(`   💾 UDP timeout #${i}: req=${capture.udpRequests[i].length}B (no response)`)
    }
  }

  if (capture.tcpRequests && capture.tcpRequests.length > capture.tcp.length) {
    const startIndex = capture.tcp.length
    for (let i = startIndex; i < capture.tcpRequests.length; i++) {
      const reqPath = path.join(captureDir, `tcp-req-timeout-${i}.bin`)
      fs.writeFileSync(reqPath, capture.tcpRequests[i])
      console.log(`   💾 TCP timeout #${i}: req=${capture.tcpRequests[i].length}B (no response)`)
    }
  }

  // Save metadata
  const metaPath = path.join(captureDir, `meta.json`)
  const metadata = {
    name,
    capturedAt: new Date().toISOString(),
    udpPackets: capture.udp.length,
    tcpPackets: capture.tcp.length,
    udpTimeouts: (capture.udpRequests?.length || 0) - capture.udp.length,
    tcpTimeouts: (capture.tcpRequests?.length || 0) - capture.tcp.length
  }
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
  console.log(`   💾 Saved to: ${name}/`)
}

async function main () {
  console.log('=' .repeat(60))
  console.log('📡 Binary Response Capture Utility')
  console.log('=' .repeat(60))
  console.log(`📁 Binary files will be saved to: ${BINARY_DIR}\n`)

  for (const target of TARGETS) {
    await captureServer(target)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Capture complete!')
  console.log('='.repeat(60))
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

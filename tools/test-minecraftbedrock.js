/*
Local checks for the Minecraft: Bedrock Edition protocol (RakNet and the NetherNet `/v1/join` fallback).
Spins up local mock servers, no network access needed.
Usage: node tools/test-minecraftbedrock.js
 */
import { createServer } from 'node:http'
import { createSocket } from 'node:dgram'
import { once } from 'node:events'
import assert from 'node:assert/strict'
import { GameDig } from './../lib/index.js'

const sampleJoin = {
  name: 'Dedicated Server',
  protocol: 2177,
  version: '1.26.50',
  level: 'Bedrock level',
  players: 3,
  maxPlayers: 10,
  gameType: 1
}

const queryOptions = {
  type: 'protocol-minecraftbedrock',
  host: '127.0.0.1',
  socketTimeout: 500,
  attemptTimeout: 5000,
  maxRetries: 0,
  portCache: false
}

const withHttpServer = async (handler, fn) => {
  const requests = []
  const server = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`)
    handler(req, res)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    return await fn(server.address().port, requests)
  } finally {
    server.close()
  }
}

// QueryRunner wraps protocol errors, the original ones are appended to the stack.
const assertQueryFails = (options, pattern) => assert.rejects(GameDig.query(options), e => {
  assert.match(e.stack, pattern)
  return true
})

const jsonHandler = body => (req, res) => {
  if (req.method !== 'GET' || req.url !== '/v1/join') {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(body)
}

const tests = {
  'nethernet fallback maps /v1/join': async () => {
    await withHttpServer(jsonHandler(JSON.stringify(sampleJoin)), async (port, requests) => {
      const state = await GameDig.query({ ...queryOptions, port })
      assert.equal(state.name, 'Dedicated Server')
      assert.equal(state.map, 'Bedrock level')
      assert.equal(state.numplayers, 3)
      assert.equal(state.maxplayers, 10)
      assert.equal(state.version, '1.26.50')
      assert.equal(state.raw.transport, 'nethernet')
      assert.equal(state.raw.protocolVersion, '2177')
      assert.equal(state.raw.gameMode, 'Creative')
      assert.deepEqual(state.raw.nethernet, sampleJoin)
      assert.ok(requests.includes('GET /v1/join'))
    })
  },
  'nethernet fallback through the mbe game type': async () => {
    await withHttpServer(jsonHandler(JSON.stringify(sampleJoin)), async (port) => {
      const state = await GameDig.query({ ...queryOptions, type: 'mbe', port })
      assert.equal(state.name, 'Dedicated Server')
      assert.equal(state.numplayers, 3)
      assert.equal(state.maxplayers, 10)
      assert.equal(state.version, '1.26.50')
      assert.equal(state.raw.bedrock.raw.transport, 'nethernet')
    })
  },
  'nethernet name with escaped formatting codes': async () => {
    const body = JSON.stringify({ ...sampleJoin, name: '\\u00a71My \\u00a7lServer' })
    await withHttpServer(jsonHandler(body), async (port) => {
      const state = await GameDig.query({ ...queryOptions, type: 'mbe', port })
      assert.equal(state.raw.bedrock.name, '\u00a71My \u00a7lServer')
      assert.equal(state.name, 'My Server')
    })
  },
  'nethernet empty body fails': async () => {
    await withHttpServer(jsonHandler(''), async (port) => {
      await assertQueryFails({ ...queryOptions, port }, /empty body/)
    })
  },
  'nethernet non-JSON body fails': async () => {
    await withHttpServer(jsonHandler('<html>nope</html>'), async (port) => {
      await assertQueryFails({ ...queryOptions, port }, /invalid JSON/)
    })
  },
  'nethernet unsupported (404) fails': async () => {
    await withHttpServer((req, res) => res.writeHead(404).end(), async (port) => {
      await assertQueryFails({ ...queryOptions, port }, /Response code 404/)
    })
  },
  'raknet is preferred when it answers': async () => {
    await withHttpServer(jsonHandler(JSON.stringify(sampleJoin)), async (port, requests) => {
      const udp = createSocket('udp4')
      udp.on('message', (msg, rinfo) => {
        if (msg[0] !== 0x01) return
        const status = Buffer.from('MCPE;RakNet Server;800;1.21.0;1;20;123;World;Survival;1;19132;19133;', 'utf8')
        const length = Buffer.alloc(2)
        length.writeUInt16BE(status.length)
        const pong = Buffer.concat([
          Buffer.from([0x1c]),
          msg.subarray(1, 9),
          Buffer.alloc(8),
          Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'),
          length,
          status
        ])
        udp.send(pong, rinfo.port, rinfo.address)
      })
      udp.bind(port, '127.0.0.1')
      await once(udp, 'listening')
      try {
        const state = await GameDig.query({ ...queryOptions, port })
        assert.equal(state.name, 'RakNet Server')
        assert.equal(state.numplayers, 1)
        assert.equal(state.maxplayers, 20)
        assert.equal(state.raw.transport, 'raknet')
        assert.equal(requests.length, 0)
      } finally {
        udp.close()
      }
    })
  }
}

const run = async () => {
  let failed = 0
  for (const [name, test] of Object.entries(tests)) {
    try {
      await test()
      console.log(`PASS ${name}`)
    } catch (e) {
      failed++
      console.log(`FAIL ${name}`)
      console.log(e)
    }
  }

  console.log(failed ? `${failed} test(s) failed` : 'All tests passed')
  process.exit(failed ? 1 : 0)
}

run()

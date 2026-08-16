import Core from './core.js'

export default class teamspeak6 extends Core {
  async run (state) {
    this.usedTcp = true

    const apiKey = this.options.token
    if (!apiKey) {
      throw new Error('TeamSpeak 6 HTTP query requires an API key. Pass it via options.token.')
    }

    const baseUrl = `http://${this.options.address}:${queryPort}`

    const call = async (path, { searchParams } = {}) => {
      const res = await this.request({
        url: baseUrl + path,
        method: 'GET',
        responseType: 'json',
        headers: {
          'x-api-key': apiKey
        },
        searchParams
      })

      if (!res?.status) throw new Error('Invalid TS6 WebQuery response')
      if (res.status.code !== 0) {
        throw new Error(`${res.status.message || 'query error'} (code ${res.status.code})`)
      }
      return res.body || []
    }

    const serverlist = await call('/serverlist')
    const voicePort = String(this.options.port)
    const vs = serverlist.find(s => String(s.virtualserver_port) === voicePort) || null

    if (!vs) {
      const ports = serverlist.map(s => s.virtualserver_port).join(', ')
      throw new Error(`No virtual server found for voice port ${voicePort}. Available: [${ports}]`)
    }

    const vsid = String(vs.virtualserver_id)

    const serverinfoArr = await call(`/${vsid}/serverinfo`)
    const serverinfo = serverinfoArr[0] || {}
    state.raw = { serverinfo }

    if ('virtualserver_name' in serverinfo) state.name = serverinfo.virtualserver_name
    if ('virtualserver_maxclients' in serverinfo) state.maxplayers = Number(serverinfo.virtualserver_maxclients)
    if ('virtualserver_clientsonline' in serverinfo) state.numplayers = Number(serverinfo.virtualserver_clientsonline)
    if ('virtualserver_version' in serverinfo) state.version = serverinfo.virtualserver_version

    const clients = await call(`/${vsid}/clientlist`)
    for (const client of clients) {
      if (String(client.client_type) !== '0') continue

      const player = { ...client }
      player.name = player.client_nickname || ''
      delete player.client_nickname

      state.players.push(player)
    }

    const channels = await call(`/${vsid}/channellist`, {
      searchParams: { '-topic': 1 }
    })
    state.raw.channels = channels
  }
}

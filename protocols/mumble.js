import Core from './core.js'

export default class mumble extends Core {
  async run (state) {
    const json = await this.withTcp(async socket => {
      return await this.tcpSend(socket, 'json', (buffer) => {
        if (buffer.length < 10) return
        const str = buffer.toString()
        let json
        try {
          json = JSON.parse(str)
        } catch (e) {
          // probably not all here yet
          return
        }
        return json
      })
    })

    state.raw = json
    state.name = json.name
    state.gamePort = json.x_gtmurmur_connectport || 64738

    let channelStack = [state.raw.root]
    while (channelStack.length) {
      const channel = channelStack.shift()
      channel.description = this.cleanComment(channel.description)
      channelStack = channelStack.concat(channel.channels)
      for (const user of channel.users) {
        user.comment = this.cleanComment(user.comment)
        state.players.push(user)
      }
    }
  }

  cleanComment (str) {
    return str.replace(/<.*>/g, '')
  }
}

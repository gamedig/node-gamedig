import Core from './core.js'

export default class palworldmaster extends Core {
  async run (state) {
    let servers = []

    for await (const batch of this.page()) {
      servers = servers.concat(batch)
    }

    state.servers = servers
  }

  async * page () {
    let hasNextPage = true
    let currentPage = 1
    while (hasNextPage) {
      const request = await this.request({
        url: `https://api.palworldgame.com/server/list?page=${currentPage + 1}`,
        responseType: 'json'
      })

      currentPage = request.current_page
      hasNextPage = request.is_next_page
      yield request.server_list
    }
  }
}

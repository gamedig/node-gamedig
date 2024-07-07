import Core from './core.js'

export default class assettocorsa extends Core {
  async run (state) {
    const serverInfo = await this.request({
      url: `http://${this.options.address}:${this.options.port}/INFO`,
      responseType: 'json'
    })
    const carInfo = await this.request({
      url: `http://${this.options.address}:${this.options.port}/JSON|${Math.floor(Math.random() * 999999999999999)}`,
      responseType: 'json'
    })

    if (!serverInfo || !carInfo || !carInfo.Cars) {
      throw new Error('Query not successful')
    }

    state.maxplayers = serverInfo.maxclients
    state.name = serverInfo.name
    state.map = serverInfo.track
    state.password = serverInfo.pass
    state.gamePort = serverInfo.port
    state.numplayers = serverInfo.clients
    state.version = serverInfo.poweredBy

    state.raw.carInfo = carInfo.Cars
    state.raw.serverInfo = serverInfo

    for (const car of carInfo.Cars) {
      if (car.IsConnected) {
        state.players.push({
          name: car.DriverName,
          car: car.Model,
          skin: car.Skin,
          nation: car.DriverNation,
          team: car.DriverTeam
        })
      }
    }
  }
}

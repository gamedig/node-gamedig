import Epic from './epic.js'

export default class renown extends Epic {
  constructor () {
    super()

    // OAuth2 credentials provided by the game developer.
    this.clientId = 'xyza7891XjE03sj3B404z0iQfQ4efjUj'
    this.clientSecret = '2YY7STKJ5wJuFIyR8TaXaBPfhHZiAY13YuNPSIn+0WY'
    this.deploymentId = '472a8286c61c408ca5ca1ec0401f07b7'
    this.authByExternalToken = true
  }

  async run (state) {
    await super.run(state)
    state.name = state.raw.attributes.SERVERNAME_s
    state.password = state.raw.attributes.PASSWORD_b
    state.version = state.raw.attributes.SERVERVERSION_s
  }
}

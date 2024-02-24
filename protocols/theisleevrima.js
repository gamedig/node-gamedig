import Epic from './epic.js'

export default class theisleevrima extends Epic {
  constructor () {
    super()

    // OAuth2 credentials extracted from The Isle Evrima files.
    this.clientId = 'xyza7891gk5PRo3J7G9puCJGFJjmEguW'
    this.clientSecret = 'pKWl6t5i9NJK8gTpVlAxzENZ65P8hYzodV8Dqe5Rlc8'
    this.deploymentId = '6db6bea492f94b1bbdfcdfe3e4f898dc'
  }

  async run (state) {
    await super.run(state)
    state.name = state.raw.attributes.SERVERNAME_s
    state.map = state.raw.attributes.MAP_NAME_s
    state.version = state.raw.attributes.SERVER_VERSION_s
  }
}

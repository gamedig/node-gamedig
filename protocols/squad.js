import Epic from './epic.js'

export default class squad extends Epic {
  constructor () {
    super()

    // OAuth2 credentials extracted by intercepting Squad traffic.
    this.clientId = 'xyza7891J7d3GU8ZIwCoC5xdBsdoqVWA'
    this.clientSecret = '4SLVBqAm09q776SIlQRTD6moM/bnGAWhDSqOxJAIS0s'
    this.deploymentId = '5dee4062a90b42cd98fcad618b6636c2'
    this.authByExternalToken = true
  }

  async run (state) {
    await super.run(state)
    state.name = state.raw.attributes.SERVERNAME_s
    state.password = state.raw.attributes.PASSWORD_b
    state.version = state.raw.attributes.GAMEVERSION_s
  }
}

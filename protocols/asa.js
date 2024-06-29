import Epic from './epic.js'

export default class asa extends Epic {
  constructor () {
    super()

    // OAuth2 credentials extracted from ARK: Survival Ascended files.
    this.clientId = 'xyza7891muomRmynIIHaJB9COBKkwj6n'
    this.clientSecret = 'PP5UGxysEieNfSrEicaD1N2Bb3TdXuD7xHYcsdUHZ7s'
    this.deploymentId = 'ad9a8feffb3b4b2ca315546f038c3ae2'
  }

  async run (state) {
    await super.run(state)
    state.version = state.raw.attributes.BUILDID_s + '.' + state.raw.attributes.MINORBUILDID_s
  }
}

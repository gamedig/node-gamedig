import Epic from './epic.js'

export default class asa extends Epic {
  constructor () {
    super()

    this.clientId = 'xyza7891muomRmynIIHaJB9COBKkwj6n'
    this.clientSecret = 'PP5UGxysEieNfSrEicaD1N2Bb3TdXuD7xHYcsdUHZ7s'

    // Unofficial server deployment ID for ASA.
    // TODO: Add official server deployment ID.
    this.deploymentId = 'ad9a8feffb3b4b2ca315546f038c3ae2'
  }
}

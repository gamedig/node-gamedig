import Epic from './epic.js'

export default class palworld extends Epic {
  constructor () {
    super()

    // OAuth2 credentials extracted from Palworld files.
    this.clientId = 'xyza78916PZ5DF0fAahu4tnrKKyFpqRE'
    this.clientSecret = 'j0NapLEPm3R3EOrlQiM8cRLKq3Rt02ZVVwT0SkZstSg'
    this.deploymentId = '0a18471f93d448e2a1f60e47e03d3413'
    this.alternativeAuth = true;
  }
}

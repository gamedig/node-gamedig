import samp from './samp.js'

export default class vcmp extends samp {
  constructor () {
    super()
    this.magicHeader = 'VCMP'
    this.responseMagicHeader = 'MP04'
    this.isVcmp = true
  }
}

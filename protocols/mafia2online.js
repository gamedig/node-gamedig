import mafia2mp from './mafia2mp.js'

export default class mafia2online extends mafia2mp {
  constructor () {
    super()
    this.header = 'M2Online'
    this.isMafia2Online = true
  }
}

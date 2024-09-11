import unrealengine3lan from './unrealengine3lan.js'
import { TranslateMapUT3 } from './ut3.js'

/**
 * Implements the LAN protocol for UT3
 */
export default class ut3lan extends unrealengine3lan {
  constructor () {
    super()
    this.translateMap = { ...TranslateMapUT3 }
  }
}

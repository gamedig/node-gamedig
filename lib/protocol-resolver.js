import * as protocols from '../protocols/index.js'

export const getProtocol = (protocolId) => {
  if (!(protocolId in protocols)) { throw Error('Protocol definition file missing: ' + protocolId) }

  return new protocols[protocolId]()
}

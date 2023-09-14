import * as Protocols from '../protocols/index.js'

export const getProtocol = (protocolId) => {
    if(!(protocolId in Protocols))
        throw Error('Protocol definition file missing: ' + protocolId);

    return new Protocols[protocolId];
}

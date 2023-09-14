import * as Protocols from '../protocols/index.js'

export const getProtocol = (protocolId) => {
    const mappedObject = {};
    Object.keys(Protocols).forEach((key) => {
        mappedObject[key.toLowerCase()] = Protocols[key];
    }); // meh, it would be better to change all exports to lower case instead of doing this every time,
    // it has no reason why would we export stuff with a capital letter instead of lowercase everything

    if(!(protocolId in mappedObject))
        throw Error('Protocol definition file missing: ' + protocolId);

    return new mappedObject[protocolId];
}

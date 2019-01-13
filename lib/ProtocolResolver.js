const Path = require('path'),
    fs = require('fs'),
    Core = require('../protocols/core');

class ProtocolResolver {
    constructor() {
        this.protocolDir = Path.normalize(__dirname+'/../protocols');
    }

    /**
     * @returns Core
     */
    create(protocolId) {
        protocolId = Path.basename(protocolId);
        const path = this.protocolDir+'/'+protocolId;
        if(!fs.existsSync(path+'.js')) throw Error('Protocol definition file missing: '+type);
        const protocol = require(path);
        return new protocol();
    }
}

module.exports = ProtocolResolver;

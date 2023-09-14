import * as Path from 'path';
import * as fs from 'fs';

export default class ProtocolResolver {
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

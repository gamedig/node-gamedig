import * as fs from 'fs';
import {fileURLToPath} from "url";
import path from "path";

export default class ProtocolResolver {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.protocolDir = path.normalize(__dirname+'/../protocols');
    }

    /**
     * @returns Core
     */
    create(protocolId) {
        protocolId = path.basename(protocolId);
        const Path = this.protocolDir+'/'+protocolId;
        if(!fs.existsSync(Path+'.js')) throw Error('Protocol definition file missing: '+type);
        const protocol = require(Path);
        return new protocol();
    }
}

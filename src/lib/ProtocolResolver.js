import { normalize, basename } from "path";
import { existsSync } from "fs";

class ProtocolResolver {
  constructor() {
    this.protocolDir = normalize(__dirname + "/../protocols");
  }

  /**
   * @returns Core
   */
  create(protocolId) {
    protocolId = basename(protocolId);
    const path = this.protocolDir + "/" + protocolId;
    if (!existsSync(path + ".js"))
      throw Error("Protocol definition file missing: " + type);
    const protocol = require(path);
    return new protocol();
  }
}

export default ProtocolResolver;

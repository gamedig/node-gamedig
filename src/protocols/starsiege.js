import Tribes1 from "./tribes1";

class Starsiege extends Tribes1 {
  constructor() {
    super();
    this.encoding = "latin1";
    this.requestByte = 0x72;
    this.responseByte = 0x73;
  }
}

export default Starsiege;

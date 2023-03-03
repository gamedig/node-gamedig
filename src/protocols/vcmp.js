import Samp from "./samp";

class Vcmp extends Samp {
  constructor() {
    super();
    this.magicHeader = "VCMP";
    this.responseMagicHeader = "MP04";
    this.isVcmp = true;
  }
}

export default Vcmp;

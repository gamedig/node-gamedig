import Mafia2Multiplayer from "./mafia2mp";

class Mafia2Online extends Mafia2Multiplayer {
  constructor() {
    super();
    this.header = "M2Online";
    this.isMafia2Online = true;
  }
}

export default Mafia2Online;

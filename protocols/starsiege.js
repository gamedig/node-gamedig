import {Tribes1} from "./tribes1";

export class Starsiege extends Tribes1 {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.requestByte = 0x72;
        this.responseByte = 0x73;
    }
}

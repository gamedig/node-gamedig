import Samp from './samp';

export class Vcmp extends Samp {
    constructor() {
        super();
        this.magicHeader = 'VCMP';
        this.responseMagicHeader = 'MP04';
        this.isVcmp = true;
    }
}

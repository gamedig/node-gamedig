import Samp from './samp';

export default class Vcmp extends Samp {
    constructor() {
        super();
        this.magicHeader = 'VCMP';
        this.responseMagicHeader = 'MP04';
        this.isVcmp = true;
    }
}

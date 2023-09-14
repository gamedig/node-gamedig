import Quake2 from './quake2.js';

export default class Quake1 extends Quake2 {
    constructor() {
        super();
        this.responseHeader = 'n';
        this.isQuake1 = true;
    }
}

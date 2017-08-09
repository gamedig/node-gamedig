// supposedly, gamespy3 is the "official" query protocol for jcmp,
// but it's broken (requires useOnlySingleSplit), and doesn't include player names
class Jc2mp extends require('./gamespy3') {
    constructor() {
        super();
        this.useOnlySingleSplit = true;
    }
    finalizeState(state) {
        super.finalizeState(state);
        if(!state.players.length && parseInt(state.raw.numplayers)) {
            for(let i = 0; i < parseInt(state.raw.numplayers); i++) {
                state.players.push({});
            }
        }
    }
}

module.exports = Jc2mp;

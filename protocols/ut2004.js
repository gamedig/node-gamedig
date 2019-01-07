const Unreal2 = require('./unreal2');

class Ut2004 extends Unreal2 {
    readExtraInfo(reader,state) {
        state.raw.ping = reader.uint(4);
        state.raw.flags = reader.uint(4);
        state.raw.skill = reader.uint(2);
    }
}

module.exports = Ut2004;

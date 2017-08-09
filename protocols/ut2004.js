class Ut2004 extends require('./unreal2') {
    readExtraInfo(reader,state) {
        state.raw.ping = reader.uint(4);
        state.raw.flags = reader.uint(4);
        state.raw.skill = reader.uint(2);
    }
}

module.exports = Ut2004;

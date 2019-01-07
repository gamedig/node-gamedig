const Unreal2 = require('./unreal2');

class KillingFloor extends Unreal2 {
    readExtraInfo(reader,state) {
        state.raw.wavecurrent = reader.uint(4);
        state.raw.wavetotal = reader.uint(4);
    }
}

module.exports = KillingFloor;

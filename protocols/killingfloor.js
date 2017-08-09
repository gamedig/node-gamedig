class KillingFloor extends require('./unreal2') {
    readExtraInfo(reader,state) {
        state.raw.wavecurrent = reader.uint(4);
        state.raw.wavetotal = reader.uint(4);
    }
}

module.exports = KillingFloor;

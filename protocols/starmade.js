const Core = require('./core');

class Starmade extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    async run(state) {
        const b = Buffer.from([0x00,0x00,0x00,0x09,0x2a,0xff,0xff,0x01,0x6f,0x00,0x00,0x00,0x00]);

        const payload = await this.withTcp(async socket => {
            return await this.tcpSend(socket, b, buffer => {
                if (buffer.length < 12) return;
                const reader = this.reader(buffer);
                const packetLength = reader.uint(4);
                this.logger.debug("Received packet length: " + packetLength);
                const timestamp = reader.uint(8);
                this.logger.debug("Received timestamp: " + timestamp);
                if (reader.remaining() < packetLength || reader.remaining() < 5) return;

                const checkId = reader.uint(1);
                const packetId = reader.uint(2);
                const commandId = reader.uint(1);
                const type = reader.uint(1);

                this.logger.debug("checkId=" + checkId + " packetId=" + packetId + " commandId=" + commandId + " type=" + type);
                if (checkId !== 0x2a) return;

                return reader.rest();
            });
        });

        const reader = this.reader(payload);

        const data = [];
        state.raw.data = data;

        while(!reader.done()) {
            const mark = reader.uint(1);
            if(mark === 1) {
                // signed int
                data.push(reader.int(4));
            } else if(mark === 3) {
                // float
                data.push(reader.float());
            } else if(mark === 4) {
                // string
                data.push(reader.pascalString(2));
            } else if(mark === 6) {
                // byte
                data.push(reader.uint(1));
            }
        }

        this.logger.debug("Received raw data array", data);

        if(typeof data[0] === 'number') state.raw.infoVersion = data[0];
        if(typeof data[1] === 'number') state.raw.version = data[1];
        if(typeof data[2] === 'string') state.name = data[2];
        if(typeof data[3] === 'string') state.raw.description = data[3];
        if(typeof data[4] === 'number') state.raw.startTime = data[4];
        if(typeof data[5] === 'number') state.players = data[5];
        if(typeof data[6] === 'number') state.maxplayers = data[6];
    }
}

module.exports = Starmade;

const varint = require('varint'),
    async = require('async');

function varIntBuffer(num) {
    return Buffer.from(varint.encode(num));
}
function buildPacket(id,data) {
    if(!data) data = Buffer.from([]);
    const idBuffer = varIntBuffer(id);
    return Buffer.concat([
        varIntBuffer(data.length+idBuffer.length),
        idBuffer,
        data
    ]);
}

class MinecraftPing extends require('./core') {
    run(state) {
        let receivedData;

        async.series([
            (c) => {
                // build and send handshake and status TCP packet

                const portBuf = Buffer.alloc(2);
                portBuf.writeUInt16BE(this.options.port_query,0);

                const addressBuf = Buffer.from(this.options.address,'utf8');

                const bufs = [
                    varIntBuffer(4),
                    varIntBuffer(addressBuf.length),
                    addressBuf,
                    portBuf,
                    varIntBuffer(1)
                ];

                const outBuffer = Buffer.concat([
                    buildPacket(0,Buffer.concat(bufs)),
                    buildPacket(0)
                ]);

                this.tcpSend(outBuffer, (data) => {
                    if(data.length < 10) return false;
                    const expected = varint.decode(data);
                    data = data.slice(varint.decode.bytes);
                    if(data.length < expected) return false;
                    receivedData = data;
                    c();
                    return true;
                });
            },
            (c) => {
                // parse response

                let data = receivedData;
                const packetId = varint.decode(data);
                if(this.debug) console.log("Packet ID: "+packetId);
                data = data.slice(varint.decode.bytes);

                const strLen = varint.decode(data);
                if(this.debug) console.log("String Length: "+strLen);
                data = data.slice(varint.decode.bytes);

                const str = data.toString('utf8');
                if(this.debug) {
                    console.log(str);
                }

                let json;
                try {
                    json = JSON.parse(str);
                    delete json.favicon;
                } catch(e) {
                    return this.fatal('Invalid JSON');
                }

                state.raw.version = json.version.name;
                state.maxplayers = json.players.max;
                state.raw.description = json.description.text;
                if(json.players.sample) {
                    for(const player of json.players.sample) {
                        state.players.push({
                            id: player.id,
                            name: player.name
                        });
                    }
                }
                while(state.players.length < json.players.online) {
                    state.players.push({});
                }

                this.finish(state);
            }
        ]);
    }
}

module.exports = MinecraftPing;

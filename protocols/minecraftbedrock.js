const Core = require('./core');

class MinecraftBedrock extends Core {
    constructor() {
        super();
        this.byteorder = 'be';
    }

    async run(state) {
        const bufs = [
            Buffer.from([0x01]), // Message ID, ID_UNCONNECTED_PING
            Buffer.from('1122334455667788', 'hex'), // Nonce / timestamp
            Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'), // Magic
            Buffer.from('0000000000000000', 'hex') // Cliend GUID
        ];

        return await this.udpSend(Buffer.concat(bufs), buffer => {
            const reader = this.reader(buffer);

            const messageId = reader.uint(1);
            if (messageId !== 0x1c) {
                this.logger.debug('Skipping packet, invalid message id');
                return;
            }

            const nonce = reader.part(8).toString('hex'); // should match the nonce we sent
            this.logger.debug('Nonce: ' + nonce);
            if (nonce !== '1122334455667788') {
                this.logger.debug('Skipping packet, invalid nonce');
                return;
            }

            // These 8 bytes are identical to the serverId string we receive in decimal below
            reader.skip(8);

            const magic = reader.part(16).toString('hex');
            this.logger.debug('Magic value: ' + magic);
            if (magic !== '00ffff00fefefefefdfdfdfd12345678') {
                this.logger.debug('Skipping packet, invalid magic');
                return;
            }

            const statusLen = reader.uint(2);
            if (reader.remaining() !== statusLen) {
                throw new Error('Invalid status length: ' + reader.remaining() + ' vs ' + statusLen);
            }

            const statusStr = reader.rest().toString('utf8');
            this.logger.debug('Raw status str: ' + statusStr);

            const split = statusStr.split(';');
            if (split.length < 6) {
                throw new Error('Missing enough chunks in status str');
            }

            state.raw.edition = split.shift();
            state.name = split.shift();
            state.raw.protocolVersion = split.shift();
            state.raw.mcVersion = split.shift();
            state.players.setNum(parseInt(split.shift()));
            state.maxplayers = parseInt(split.shift());
            if (split.length) state.raw.serverId = split.shift();
            if (split.length) state.map = split.shift();
            if (split.length) state.raw.gameMode = split.shift();
            if (split.length) state.raw.nintendoOnly = !!parseInt(split.shift());
            if (split.length) state.raw.ipv4Port = split.shift();
            if (split.length) state.raw.ipv6Port = split.shift();

            return true;
        });

    }

}

module.exports = MinecraftBedrock;

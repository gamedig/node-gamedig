const Core = require('./core');

class MinecraftBedrock extends Core {
    constructor() {
        super();
        this.byteorder = 'be';
    }

    async run(state) {
        const bufs = [
            Buffer.from([0x01]), // Message ID, ID_UNCONNECTED_PING
            Buffer.from('0000000000000000', 'hex'), // Nonce / timestamp
            Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'), // Magic
            Buffer.from('0000000000000000', 'hex') // Cliend GUID
        ];

        return await this.udpSend(Buffer.concat(bufs), buffer => {
            const reader = this.reader(buffer);

            const messageId = reader.uint(1);
            if (messageId !== 0x1c) {
                throw new Error('Invalid message id');
            }

            const nonce = reader.part(8).toString('hex'); // should match the nonce we sent
            this.logger.debug('Nonce: ' + nonce);

            // These 8 bytes are identical to the serverId string we receive in decimal below
            reader.skip(8);

            const magic = reader.part(16).toString('hex');
            this.logger.debug('Magic value: ' + magic);

            const statusLen = reader.uint(2);
            if (reader.remaining() !== statusLen) {
                throw new Error('Invalid status length: ' + reader.remaining() + ' vs ' + statusLen);
            }

            const statusStr = reader.rest().toString('utf8');
            this.logger.debug('Raw status str: ' + statusStr);

            const split = statusStr.split(';');
            if (split.length < 12) {
                throw new Error('Missing enough chunks in status str');
            }

            let i = 0;
            state.raw.edition = split[i++];
            state.name = split[i++];
            state.raw.protocolVersion = split[i++];
            state.raw.mcVersion = split[i++];
            state.players = parseInt(split[i++]);
            state.maxplayers = parseInt(split[i++]);
            state.raw.serverId = split[i++];
            state.map = split[i++];
            state.raw.gameMode = split[i++];
            state.raw.nintendoOnly = !!parseInt(split[i++]);
            state.raw.ipv4Port = split[i++];
            state.raw.ipv6Port = split[i++];

            return true;
        });

    }

}

module.exports = MinecraftBedrock;

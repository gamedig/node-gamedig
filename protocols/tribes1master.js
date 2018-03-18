/** Unsupported -- use at your own risk!! */

class Tribes1Master extends require('./core') {
    constructor() {
        super();
        this.encoding = 'latin1';
    }
    run(state) {
        const queryBuffer = Buffer.from([
            0x10, // standard header
            0x03, // dump servers
            0xff, // ask for all packets
            0x00, // junk
            0x01, 0x02, // challenge
        ]);

        let parts = new Map();
        let total = 0;
        this.udpSend(queryBuffer,(buffer) => {
            const reader = this.reader(buffer);
            const header = reader.uint(2);
            if (header !== 0x0610) {
                this.fatal('Header response does not match: ' + header.toString(16));
                return true;
            }
            const num = reader.uint(1);
            const t = reader.uint(1);
            if (t <= 0 || (total > 0 && t !== total)) {
                this.fatal('Conflicting total: ' + t);
                return true;
            }
            total = t;

            if (num < 1 || num > total) {
                this.fatal('Invalid packet number: ' + num + ' ' + total);
                return true;
            }
            if (parts.has(num)) {
                this.fatal('Duplicate part: ' + num);
                return true;
            }

            reader.skip(2); // challenge (0x0201)
            reader.skip(2); // always 0x6600
            parts.set(num, reader.rest());

            if (parts.size === total) {
                const ordered = [];
                for (let i = 1; i <= total; i++) ordered.push(parts.get(i));
                const full = Buffer.concat(ordered);
                const fullReader = this.reader(full);

                state.raw.name = this.readString(fullReader);
                state.raw.motd = this.readString(fullReader);

                state.raw.servers = [];
                while (!fullReader.done()) {
                    fullReader.skip(1); // junk ?
                    const count = fullReader.uint(1);
                    for (let i = 0; i < count; i++) {
                        const six = fullReader.uint(1);
                        if (six !== 6) {
                            this.fatal('Expecting 6');
                            return true;
                        }
                        const ip = fullReader.uint(4);
                        const port = fullReader.uint(2);
                        const ipStr = (ip & 255) + '.' + (ip >> 8 & 255) + '.' + (ip >> 16 & 255) + '.' + (ip >>> 24);
                        state.raw.servers.push(ipStr+":"+port);
                    }
                }
                this.finish(state);
                return true;
            }
        });
    }
    readString(reader) {
        const length = reader.uint(1);
        if(!length) return '';
        return reader.string({length:length});
    }
}

module.exports = Tribes1Master;

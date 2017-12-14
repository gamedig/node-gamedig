class Quake2 extends require('./core') {
    constructor() {
        super();
        this.options.tcpTimeout = timeout
        this.options.udpTimeout = timeout
        this.encoding = 'latin1';
        this.delimiter = '\n';
        this.sendHeader = 'status';
        this.responseHeader = 'print';
        this.isQuake1 = false;
    }

    run(state) {
        this.udpSend('\xff\xff\xff\xff'+this.sendHeader+'\x00', (buffer) => {
            const reader = this.reader(buffer);

            const header = reader.string({length:4});
            if(header !== '\xff\xff\xff\xff') return;

            let response;
            if(this.isQuake1) {
                response = reader.string({length:this.responseHeader.length});
            } else {
                response = reader.string();
            }
            if(response !== this.responseHeader) return;

            const info = reader.string().split('\\');
            if(info[0] === '') info.shift();

            while(true) {
                const key = info.shift();
                const value = info.shift();
                if(typeof value === 'undefined') break;
                state.raw[key] = value;
            }

            while(!reader.done()) {
                const line = reader.string();
                if(!line || line.charAt(0) === '\0') break;

                const args = [];
                const split = line.split('"');
                split.forEach((part,i) => {
                    const inQuote = (i%2 === 1);
                    if(inQuote) {
                        args.push(part);
                    } else {
                        const splitSpace = part.split(' ');
                        for (const subpart of splitSpace) {
                            if(subpart) args.push(subpart);
                        }
                    }
                });

                const player = {};
                if(this.isQuake1) {
                    player.id = parseInt(args.shift());
                    player.score = parseInt(args.shift());
                    player.time = parseInt(args.shift());
                    player.ping = parseInt(args.shift());
                    player.name = args.shift();
                    player.skin = args.shift();
                    player.color1 = parseInt(args.shift());
                    player.color2 = parseInt(args.shift());
                } else {
                    player.frags = parseInt(args.shift());
                    player.ping = parseInt(args.shift());
                    player.name = args.shift() || '';
                    player.address = args.shift() || '';
                }

                (player.ping ? state.players : state.bots).push(player);
            }

            if('g_needpass' in state.raw) state.password = state.raw.g_needpass;
            if('mapname' in state.raw) state.map = state.raw.mapname;
            if('sv_maxclients' in state.raw) state.maxplayers = state.raw.sv_maxclients;
            if('maxclients' in state.raw) state.maxplayers = state.raw.maxclients;
            if('sv_hostname' in state.raw) state.name = state.raw.sv_hostname;
            if('hostname' in state.raw) state.name = state.raw.hostname;

            this.finish(state);
            return true;
        });
    }
}

module.exports = Quake2;

class Doom3 extends require('./core') {
    constructor() {
        super();
        this.pretty = 'Doom 3';
        this.encoding = 'latin1';
        this.isEtqw = false;
        this.hasSpaceBeforeClanTag = false;
        this.hasClanTag = false;
        this.hasTypeFlag = false;
    }
    run(state) {
        this.udpSend('\xff\xffgetInfo\x00PiNGPoNG\x00', (buffer) => {
            const reader = this.reader(buffer);

            const header = reader.uint(2);
            if(header !== 0xffff) return;
            const header2 = reader.string();
            if(header2 !== 'infoResponse') return;

            if(this.isEtqw) {
                const taskId = reader.uint(4);
            }

            const challenge = reader.uint(4);
            const protoVersion = reader.uint(4);
            state.raw.protocolVersion = (protoVersion>>16)+'.'+(protoVersion&0xffff);

            if(this.isEtqw) {
                const size = reader.uint(4);
            }

            while(!reader.done()) {
                const key = reader.string();
                let value = this.stripColors(reader.string());
                if(key === 'si_map') {
                    value = value.replace('maps/','');
                    value = value.replace('.entities','');
                }
                if(!key) break;
                state.raw[key] = value;
            }

            let i = 0;
            while(!reader.done()) {
                i++;
                const player = {};
                player.id = reader.uint(1);
                if(player.id === 32) break;
                player.ping = reader.uint(2);
                if(!this.isEtqw) player.rate = reader.uint(4);
                player.name = this.stripColors(reader.string());
                if(this.hasClanTag) {
                    if(this.hasSpaceBeforeClanTag) reader.uint(1);
                    player.clantag = this.stripColors(reader.string());
                }
                if(this.hasTypeFlag) player.typeflag = reader.uint(1);

                if(!player.ping || player.typeflag)
                    state.bots.push(player);
                else
                    state.players.push(player);
            }

            state.raw.osmask = reader.uint(4);
            if(this.isEtqw) {
                state.raw.ranked = reader.uint(1);
                state.raw.timeleft = reader.uint(4);
                state.raw.gamestate = reader.uint(1);
                state.raw.servertype = reader.uint(1);
                // 0 = regular, 1 = tv
                if(state.raw.servertype === 0) {
                    state.raw.interestedClients = reader.uint(1);
                } else if(state.raw.servertype === 1) {
                    state.raw.connectedClients = reader.uint(4);
                    state.raw.maxClients = reader.uint(4);
                }
            }

            if(state.raw.si_name) state.name = state.raw.si_name;
            if(state.raw.si_map) state.map = state.raw.si_map;
            if(state.raw.si_maxplayers) state.maxplayers = parseInt(state.raw.si_maxplayers);
            if(state.raw.si_usepass === '1') state.password = true;

            this.finish(state);
            return true;
        });
    }

    stripColors(str) {
        // uses quake 3 color codes
        return str.replace(/\^(X.{6}|.)/g,'');
    }
}

module.exports = Doom3;

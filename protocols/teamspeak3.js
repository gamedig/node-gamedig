const Core = require('./core');

class Teamspeak3 extends Core {
    async run(state) {
        const queryPort = this.options.teamspeakQueryPort || 10011;

        await this.withTcp(async socket => {
            {
                const data = await this.sendCommand(socket, 'use port='+this.options.port, true);
                const split = data.split('\n\r');
                if(split[0] !== 'TS3') throw new Error('Invalid header');
            }

            {
                const data = await this.sendCommand(socket, 'serverinfo');
                state.raw = data[0];
                if('virtualserver_name' in state.raw) state.name = state.raw.virtualserver_name;
                if('virtualserver_maxclients' in state.raw) state.maxplayers = state.raw.virtualserver_maxclients;
            }

            {
                const list = await this.sendCommand(socket, 'clientlist');
                for (const client of list) {
                    client.name = client.client_nickname;
                    delete client.client_nickname;
                    if(client.client_type === '0') {
                        state.players.push(client);
                    }
                }
            }

            {
                const data = await this.sendCommand(socket, 'channellist -topic');
                state.raw.channels = data;
            }
        }, queryPort);
    }

    async sendCommand(socket,cmd,raw) {
        const body = await this.tcpSend(socket, cmd+'\x0A', (buffer) => {
            if (buffer.length < 21) return;
            if (buffer.slice(-21).toString() !== '\n\rerror id=0 msg=ok\n\r') return;
            return buffer.slice(0, -21).toString();
        });

        if(raw) {
            return body;
        } else {
            const segments = body.split('|');
            const out = [];
            for (const line of segments) {
                const split = line.split(' ');
                const unit = {};
                for (const field of split) {
                    const equals = field.indexOf('=');
                    const key = equals === -1 ? field : field.substr(0,equals);
                    const value = equals === -1 ? '' : field.substr(equals+1)
                        .replace(/\\s/g,' ').replace(/\\\//g,'/');
                    unit[key] = value;
                }
                out.push(unit);
            }
            return out;
        }
    }
}

module.exports = Teamspeak3;

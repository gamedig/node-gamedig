const async = require('async');

class Teamspeak3 extends require('./core') {
    run(state) {
        async.series([
            (c) => {
                this.sendCommand('use port='+this.options.port, (data) => {
                    const split = data.split('\n\r');
                    if(split[0] !== 'TS3') this.fatal('Invalid header');
                    c();
                }, true);
            },
            (c) => {
                this.sendCommand('serverinfo', (data) => {
                    state.raw = data[0];
                    if('virtualserver_name' in state.raw) state.name = state.raw.virtualserver_name;
                    if('virtualserver_maxclients' in state.raw) state.maxplayers = state.raw.virtualserver_maxclients;
                    c();
                });
            },
            (c) => {
                this.sendCommand('clientlist', (list) => {
                    for (const client of list) {
                        client.name = client.client_nickname;
                        delete client.client_nickname;
                        if(client.client_type === '0') {
                            state.players.push(client);
                        }
                    }
                    c();
                });
            },
            (c) => {
                this.sendCommand('channellist -topic', (data) => {
                    state.raw.channels = data;
                    c();
                });
            },
            (c) => {
                this.finish(state);
            }
        ]);
    }
    sendCommand(cmd,c,raw) {
        this.tcpSend(cmd+'\x0A', (buffer) => {
            if(buffer.length < 21) return;
            if(buffer.slice(-21).toString() !== '\n\rerror id=0 msg=ok\n\r') return;
            const body = buffer.slice(0,-21).toString();

            let out;

            if(raw) {
                out = body;
            } else {
                const segments = body.split('|');
                out = [];
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
            }

            c(out);

            return true;
        });
    }
}

module.exports = Teamspeak3;

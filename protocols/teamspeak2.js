const async = require('async');

class Teamspeak2 extends require('./core') {
    run(state) {
        async.series([
            (c) => {
                this.sendCommand('sel '+this.options.port, (data) => {
                    if(data !== '[TS]') this.fatal('Invalid header');
                    c();
                });
            },
            (c) => {
                this.sendCommand('si', (data) => {
                    for (const line of data.split('\r\n')) {
                        const equals = line.indexOf('=');
                        const key = equals === -1 ? line : line.substr(0,equals);
                        const value = equals === -1 ? '' : line.substr(equals+1);
                        state.raw[key] = value;
                    }
                    c();
                });
            },
            (c) => {
                this.sendCommand('pl', (data) => {
                    const split = data.split('\r\n');
                    const fields = split.shift().split('\t');
                    for (const line of split) {
                        const split2 = line.split('\t');
                        const player = {};
                        split2.forEach((value,i) => {
                            let key = fields[i];
                            if(!key) return;
                            if(key === 'nick') key = 'name';
                            const m = value.match(/^"(.*)"$/);
                            if(m) value = m[1];
                            player[key] = value;
                        });
                        state.players.push(player);
                    }
                    c();
                });
            },
            (c) => {
                this.sendCommand('cl', (data) => {
                    const split = data.split('\r\n');
                    const fields = split.shift().split('\t');
                    state.raw.channels = [];
                    for (const line of split) {
                        const split2 = line.split('\t');
                        const channel = {};
                        split2.forEach((value,i) => {
                            const key = fields[i];
                            if(!key) return;
                            const m = value.match(/^"(.*)"$/);
                            if(m) value = m[1];
                            channel[key] = value;
                        });
                        state.raw.channels.push(channel);
                    }
                    c();
                });
            },
            (c) => {
                this.finish(state);
            }
        ]);
    }
    sendCommand(cmd,c) {
        this.tcpSend(cmd+'\x0A', (buffer) => {
            if(buffer.length < 6) return;
            if(buffer.slice(-6).toString() !== '\r\nOK\r\n') return;
            c(buffer.slice(0,-6).toString());
            return true;
        });
    }
}

module.exports = Teamspeak2;

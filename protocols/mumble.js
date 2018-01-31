class Mumble extends require('./core') {
    constructor() {
        super();
        this.options.socketTimeout = 5000;
    }

    run(state) {
        this.tcpSend('json', (buffer) => {
            if(buffer.length < 10) return;
            const str = buffer.toString();
            let json;
            try {
                json = JSON.parse(str);
            } catch(e) {
                // probably not all here yet
                return;
            }

            state.raw = json;
            state.name = json.name;

            let channelStack = [state.raw.root];
            while(channelStack.length) {
                const channel = channelStack.shift();
                channel.description = this.cleanComment(channel.description);
                channelStack = channelStack.concat(channel.channels);
                for(const user of channel.users) {
                    user.comment = this.cleanComment(user.comment);
                    state.players.push(user);
                }
            }

            this.finish(state);
            return true;
        });
    }

    cleanComment(str) {
        return str.replace(/<.*>/g,'');
    }
}

module.exports = Mumble;

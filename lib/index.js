const dgram = require('dgram'),
    TypeResolver = require('./typeresolver'),
    HexUtil = require('./HexUtil');

const activeQueries = new Set();

const udpSocket = dgram.createSocket('udp4');
udpSocket.unref();
udpSocket.bind();
udpSocket.on('message', (buffer, rinfo) => {
    if(Gamedig.debug) {
        console.log(rinfo.address+':'+rinfo.port+" <--UDP");
        console.log(HexUtil.debugDump(buffer));
    }
    for(const query of activeQueries) {
        if(query.options.address !== rinfo.address) continue;
        if(query.options.port_query !== rinfo.port) continue;
        query._udpIncoming(buffer);
        break;
    }
});
udpSocket.on('error', (e) => {
    if(Gamedig.debug) console.log("UDP ERROR: "+e);
});

class Gamedig {

    static query(options,callback) {
        const promise = (async () => {
            for (const key of Object.keys(options)) {
                if (['port_query', 'port'].includes(key)) {
                    options[key] = parseInt(options[key]);
                }
            }

            let query = TypeResolver.lookup(options.type);
            query.debug = Gamedig.debug;
            query.udpSocket = udpSocket;
            query.type = options.type;

            if(!('port' in query.options) && ('port_query' in query.options)) {
                if(Gamedig.isCommandLine) {
                    process.stderr.write(
                        "Warning! This game is so old, that we don't know"
                        +" what the server's connection port is. We've guessed that"
                        +" the query port for "+query.type+" is "+query.options.port_query+"."
                        +" If you know the connection port for this type of server, please let"
                        +" us know on the GameDig issue tracker, thanks!\n"
                    );
                }
                query.options.port = query.options.port_query;
                delete query.options.port_query;
            }

            // copy over options
            for(const key of Object.keys(options)) {
                query.options[key] = options[key];
            }

            activeQueries.add(query);
            try {
                return await query.runAll();
            } finally {
                activeQueries.delete(query);
            }
        })();

        if (callback && callback instanceof Function) {
            if(callback.length === 2) {
                promise
                    .then((state) => callback(null,state))
                    .catch((error) => callback(error));
            } else if (callback.length === 1) {
                promise
                    .then((state) => callback(state))
                    .catch((error) => callback({error:error}));
            }
        }

        return promise;
    }

}
Gamedig.debug = false;
Gamedig.isCommandLine = false;

module.exports = Gamedig;

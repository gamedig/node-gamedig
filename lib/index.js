const dgram = require('dgram'),
    TypeResolver = require('./typeresolver'),
    HexUtil = require('./HexUtil'),
    FreePort = require('udp-free-port');

const activeQueries = [];

class Gamedig {

    static createSocket(){
        return new Promise((resolve, reject) => {

            FreePort(( err, port ) => {

                var udpSocket = dgram.createSocket('udp4');
                udpSocket.unref();
                udpSocket.bind( port );

                udpSocket.on('message', (buffer, rinfo) => {
                    if(Gamedig.debug) {
                        console.log(rinfo.address+':'+rinfo.port+" <--UDP");
                        console.log(HexUtil.debugDump(buffer));
                    }
                    for(const query of activeQueries) {
                        if(
                            query.options.address !== rinfo.address
                            && query.options.altaddress !== rinfo.address
                        ) continue;
                        if(query.options.port_query !== rinfo.port) continue;
                        query._udpResponse(buffer);
                        break;
                    }
                });
                udpSocket.on('error', (e) => {
                    if(Gamedig.debug) console.log("UDP ERROR: "+e);
                });

                return resolve(udpSocket)

            })


        })
    }

    static query(options,callback) {
        const promise = new Promise((resolve,reject) => {
            for (const key of Object.keys(options)) {
                if (['port_query', 'port'].includes(key)) {
                    options[key] = parseInt(options[key]);
                }
            }

            options.callback = (state) => {
                if (state.error) reject(state.error);
                else resolve(state);
            };

            let query;
            try {
                query = TypeResolver.lookup(options.type, options.timeout ? options.timeout : 1000);
            } catch(e) {
                process.nextTick(() => {
                    options.callback({error:e});
                });
                return;
            }

            Gamedig.createSocket()
            .then( ( udpSocket ) => {
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

                activeQueries.push(query);

                query.on('finished',() => {
                    const i = activeQueries.indexOf(query);
                    if(i >= 0) activeQueries.splice(i, 1);
                });

                process.nextTick(() => {
                    query.start();
                });
            })
            .catch( ( e ) => {
                if(Gamedig.debug) console.log("CREATE SOCKET ERROR: "+e);
                reject( 'Error while creating socket' )
            })


        });

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

module.exports = Gamedig;

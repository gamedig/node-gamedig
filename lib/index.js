var dgram = require('dgram'),
	EventEmitter = require('events').EventEmitter,
	util = require('util'),
	dns = require('dns'),
	TypeResolver = require('./typeresolver');

var activeQueries = [];

var udpSocket = dgram.createSocket('udp4');
udpSocket.unref();
udpSocket.bind(21943);
udpSocket.on('message', function(buffer, rinfo) {
	if(Gamedig.debug) console.log(rinfo.address+':'+rinfo.port+" <--UDP "+buffer.toString('hex'));
	for(var i = 0; i < activeQueries.length; i++) {
		var query = activeQueries[i];
		if(
			query.options.address != rinfo.address
			&& query.options.altaddress != rinfo.address
		) continue;
		if(query.options.port_query != rinfo.port) continue;
		query._udpResponse(buffer);
		break;
	}
});
udpSocket.on('error', function(e) {
	if(Gamedig.debug) console.log("UDP ERROR: "+e);
});

Gamedig = {

	query: function(options,callback) {
		const promise = new Promise((resolve,reject) => {
			options.callback = (state) => {
				if (state.error) reject(state.error);
				else resolve(state);
			};

			var query;
			try {
				query = TypeResolver.lookup(options.type);
			} catch(e) {
				process.nextTick(function() {
					options.callback({error:e.message});
				});
				return;
			}
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
			for(var i in options) query.options[i] = options[i];

			activeQueries.push(query);

			query.on('finished',function(state) {
				var i = activeQueries.indexOf(query);
				if(i >= 0) activeQueries.splice(i, 1);
			});

			process.nextTick(function() {
				query.start();
			});
		});

		if (callback && callback instanceof Function) {
			if(callback.length == 2) {
				promise
					.then((state) => callback(null,state))
					.catch((error) => callback(error));
			} else if (callback.length == 1) {
				promise
					.then((state) => callback(state))
					.catch((error) => callback({error:error}));
			}
		}

		return promise;
	}

};

module.exports = Gamedig;

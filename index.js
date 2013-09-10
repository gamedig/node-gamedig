var dgram = require('dgram'),
	EventEmitter = require('events').EventEmitter,
	util = require('util'),
	dns = require('dns');

var activeQueries = [];

var udpSocket = dgram.createSocket('udp4');
udpSocket.unref();
udpSocket.bind(21943);
udpSocket.on('message', function(buffer, rinfo) {
	if(Gamedig.debug) console.log("Received",buffer,rinfo.address,rinfo.port);
	for(var i = 0; i < activeQueries.length; i++) {
		var query = activeQueries[i];
		if(
			query.options.address != rinfo.address
			&& query.options.altaddress != rinfo.address
		) continue;
		if(query.options.port != rinfo.port) continue;
		query._udpResponse(buffer);
		break;
	}
});

Gamedig = {

	query: function(options,callback) {
		if(callback) options.callback = callback;

		var type = (options.type || '').replace(/\W/g,'');
		var protocol = require('./protocols/'+type);

		var query = new protocol();
		query.udpSocket = udpSocket;
		query.type = type;
		
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

		return query;
	}

};

module.exports = Gamedig;

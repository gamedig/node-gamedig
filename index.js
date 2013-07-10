var dgram = require('dgram'),
	EventEmitter = require('events').EventEmitter,
	util = require('util'),
	dns = require('dns');

var activeQueries = [];

var udpSocket = dgram.createSocket('udp4');
udpSocket.unref();
udpSocket.bind(21943);
udpSocket.on('message', function(buffer, rinfo) {
	for(var i = 0; i < activeQueries.length; i++) {
		var query = activeQueries[i];
		if(query.address != rinfo.address) continue;
		if(query.port != rinfo.port) continue;
		query._udpResponse(buffer);
		break;
	}
});

module.exports = {

	query: function(options) {
		var type = (options.type || '').replace(/\W/g,'');

		var protocol = require('./protocols/'+type);
		var query = new protocol();
		query.udpSocket = udpSocket;
		query.type = type;
		query.options = options;
		activeQueries.push(query);

		query.on('finished',function(state) {
			var i = activeQueries.indexOf(query);
			if(i >= 0) activeQueries.splice(i, 1);

			if(options.callback) options.callback(state);
		});
		
		process.nextTick(function() {
			query.start();
		});

		return query;
	}

};

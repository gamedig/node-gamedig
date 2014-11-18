var async = require('async'),
	moment = require('moment');

module.exports = require('./core').extend({
	run: function(state) {

		var self = this;

		async.series([
			function(c) {
				var b = new Buffer([0x03,0x00,0x00]);
				self.query(0,1,1,4,function(reader, version) {
					if(version >= 4) {
						var numGrf = reader.uint(1);
						state.raw.grfs = [];
						for(var i = 0; i < numGrf; i++) {
							var grf = {};
							grf.id = reader.part(4).toString('hex');
							grf.md5 = reader.part(16).toString('hex');
							state.raw.grfs.push(grf);
						}
					}
					if(version >= 3) {
						state.raw.date_current = self.readDate(reader);
						state.raw.date_start = self.readDate(reader);
					}
					if(version >= 2) {
						state.raw.maxcompanies = reader.uint(1);
						state.raw.numcompanies = reader.uint(1);
						state.raw.maxspectators = reader.uint(1);
					}

					state.name = reader.string();
					state.raw.version = reader.string();

					state.raw.language = self.decode(
						reader.uint(1),
						['any','en','de','fr']
					);

					state.password = !!reader.uint(1);
					state.maxplayers = reader.uint(1);
					state.raw.numplayers = reader.uint(1);
					for(var i = 0; i < state.raw.numplayers; i++) {
						state.players.push({});
					}
					state.raw.numspectators = reader.uint(1);
					state.map = reader.string();
					state.raw.map_width = reader.uint(2);
					state.raw.map_height = reader.uint(2);

					state.raw.landscape = self.decode(
						reader.uint(1),
						['temperate','arctic','desert','toyland']
					);

					state.raw.dedicated = !!reader.uint(1);

					c();
				});
			},

			function(c) {
				var vehicle_types = ['train','truck','bus','aircraft','ship'];
				var station_types = ['station','truckbay','busstation','airport','dock'];

				self.query(2,3,-1,-1, function(reader,version) {
					// we don't know how to deal with companies outside version 6
					if(version != 6) return c();

					state.raw.companies = [];
					var numCompanies = reader.uint(1);
					for(var iCompany = 0; iCompany < numCompanies; iCompany++) {
						var company = {};
						company.id = reader.uint(1);
						company.name = reader.string();
						company.year_start = reader.uint(4);
						company.value = reader.uint(8);
						company.money = reader.uint(8);
						company.income = reader.uint(8);
						company.performance = reader.uint(2);
						company.password = !!reader.uint(1);

						company.vehicles = {};
						for(var i = 0; i < vehicle_types.length; i++) {
							company.vehicles[vehicle_types[i]] = reader.uint(2);
						}
						company.stations = {};
						for(var i = 0; i < station_types.length; i++) {
							company.stations[station_types[i]] = reader.uint(2);
						}

						company.clients = reader.string();
						state.raw.companies.push(company);
					}

					c();
				});
			},

			function(c) {
				self.finish(state);
			}
		]);
	},

	query: function(type,expected,minver,maxver,done) {
		var self = this;
		var b = new Buffer([0x03,0x00,type]);
		self.udpSend(b,function(buffer) {
			var reader = self.reader(buffer);

			var packetLen = reader.uint(2);
			if(packetLen != buffer.length) {
				self.fatal('Invalid reported packet length: '+packetLen+' '+buffer.length);
				return true;
			}

			var packetType = reader.uint(1);
			if(packetType != expected) {
				self.fatal('Unexpected response packet type: '+packetType);
				return true;
			}

			var protocolVersion = reader.uint(1);
			if((minver != -1 && protocolVersion < minver) || (maxver != -1 && protocolVersion > maxver)) {
				self.fatal('Unknown protocol version: '+protocolVersion+' Expected: '+minver+'-'+maxver);
				return true;
			}

			done(reader,protocolVersion);
			return true;
		});
	},

	readDate: function(reader) {
		var daysSinceZero = reader.uint(4);
		var temp = new Date(0,0,1);
		temp.setFullYear(0);
		temp.setDate(daysSinceZero+1);
		return moment(temp).format('YYYY-MM-DD');
	},

	decode: function(num,arr) {
		if(num < 0 || num >= arr.length) {
			return num;
		}
		return arr[num];
	}
});

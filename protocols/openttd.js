const async = require('async'),
    moment = require('moment');

class OpenTtd extends require('./core') {
    run(state) {
        async.series([
            (c) => {
                this.query(0,1,1,4,(reader, version) => {
                    if(version >= 4) {
                        const numGrf = reader.uint(1);
                        state.raw.grfs = [];
                        for(let i = 0; i < numGrf; i++) {
                            const grf = {};
                            grf.id = reader.part(4).toString('hex');
                            grf.md5 = reader.part(16).toString('hex');
                            state.raw.grfs.push(grf);
                        }
                    }
                    if(version >= 3) {
                        state.raw.date_current = this.readDate(reader);
                        state.raw.date_start = this.readDate(reader);
                    }
                    if(version >= 2) {
                        state.raw.maxcompanies = reader.uint(1);
                        state.raw.numcompanies = reader.uint(1);
                        state.raw.maxspectators = reader.uint(1);
                    }

                    state.name = reader.string();
                    state.raw.version = reader.string();

                    state.raw.language = this.decode(
                        reader.uint(1),
                        ['any','en','de','fr']
                    );

                    state.password = !!reader.uint(1);
                    state.maxplayers = reader.uint(1);
                    state.raw.numplayers = reader.uint(1);
                    for(let i = 0; i < state.raw.numplayers; i++) {
                        state.players.push({});
                    }
                    state.raw.numspectators = reader.uint(1);
                    state.map = reader.string();
                    state.raw.map_width = reader.uint(2);
                    state.raw.map_height = reader.uint(2);

                    state.raw.landscape = this.decode(
                        reader.uint(1),
                        ['temperate','arctic','desert','toyland']
                    );

                    state.raw.dedicated = !!reader.uint(1);

                    c();
                });
            },

            (c) => {
                const vehicle_types = ['train','truck','bus','aircraft','ship'];
                const station_types = ['station','truckbay','busstation','airport','dock'];

                this.query(2,3,-1,-1, (reader,version) => {
                    // we don't know how to deal with companies outside version 6
                    if(version !== 6) return c();

                    state.raw.companies = [];
                    const numCompanies = reader.uint(1);
                    for(let iCompany = 0; iCompany < numCompanies; iCompany++) {
                        const company = {};
                        company.id = reader.uint(1);
                        company.name = reader.string();
                        company.year_start = reader.uint(4);
                        company.value = reader.uint(8);
                        company.money = reader.uint(8);
                        company.income = reader.uint(8);
                        company.performance = reader.uint(2);
                        company.password = !!reader.uint(1);

                        company.vehicles = {};
                        for(const type of vehicle_types) {
                            company.vehicles[type] = reader.uint(2);
                        }
                        company.stations = {};
                        for(const type of station_types) {
                            company.stations[type] = reader.uint(2);
                        }

                        company.clients = reader.string();
                        state.raw.companies.push(company);
                    }

                    c();
                });
            },

            (c) => {
                this.finish(state);
            }
        ]);
    }

    query(type,expected,minver,maxver,done) {
        const b = Buffer.from([0x03,0x00,type]);
        this.udpSend(b,(buffer) => {
            const reader = this.reader(buffer);

            const packetLen = reader.uint(2);
            if(packetLen !== buffer.length) {
                this.fatal('Invalid reported packet length: '+packetLen+' '+buffer.length);
                return true;
            }

            const packetType = reader.uint(1);
            if(packetType !== expected) {
                this.fatal('Unexpected response packet type: '+packetType);
                return true;
            }

            const protocolVersion = reader.uint(1);
            if((minver !== -1 && protocolVersion < minver) || (maxver !== -1 && protocolVersion > maxver)) {
                this.fatal('Unknown protocol version: '+protocolVersion+' Expected: '+minver+'-'+maxver);
                return true;
            }

            done(reader,protocolVersion);
            return true;
        });
    }

    readDate(reader) {
        const daysSinceZero = reader.uint(4);
        const temp = new Date(0,0,1);
        temp.setFullYear(0);
        temp.setDate(daysSinceZero+1);
        return moment(temp).format('YYYY-MM-DD');
    }

    decode(num,arr) {
        if(num < 0 || num >= arr.length) {
            return num;
        }
        return arr[num];
    }
}

module.exports = OpenTtd;

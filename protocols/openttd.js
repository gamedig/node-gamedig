import Core from './core.js'

export default class openttd extends Core {
  async run(state) {
    {
      let [reader, version] = await this.query(7, 6, 1, -1)

      if (version > 7) version = 7 //current version is 7, but this should work for heigher versions too

      switch (version) {
        case 7:
          state.raw.ticks_playing = reader.uint(8)
        case 6:
          state.raw.newgrf_serialisation = reader.uint(1)
        case 5:
          state.raw.gamescript_version = reader.uint(4)
          state.raw.gamescript_name = reader.string() // .replace(/\0/g, '')
        case 4:
          const numGrf = reader.uint(1)
          state.raw.grfs = []
          for (let i = 0; i < numGrf; i++) {
            const grf = {}
            grf.id = reader.part(4).toString('hex')
            grf.md5 = reader.part(16).toString('hex')
            grf.name = reader.string()
            state.raw.grfs.push(grf)
          }
        case 3:
          state.raw.date_current = this.readDate(reader)
          state.raw.date_start = this.readDate(reader)
        case 2:
          state.raw.maxcompanies = reader.uint(1)
          state.raw.numcompanies = reader.uint(1)
          state.raw.maxspectators = reader.uint(1) //deprecated
        case 1:
          state.name = reader.string()
          state.version = reader.string()

          if (version < 6) {
            // reader.skip(1)
            state.raw.language = this.decode(
              reader.uint(1),
              ['any', 'en', 'de', 'fr']
            )
          }

          state.password = !!reader.uint(1)
          state.maxplayers = reader.uint(1)
          state.numplayers = reader.uint(1)
          state.raw.numspectators = reader.uint(1)

          if (version < 3) {
            state.raw.date_current = this.readOldDate(reader)
            state.raw.date_start = this.readOldDate(reader)
          }
          if (version < 6) {
            state.map = reader.string()
          }
          state.raw.map_width = reader.uint(2)
          state.raw.map_height = reader.uint(2)
          state.raw.landscape = this.decode(
            reader.uint(1),
            ['temperate', 'arctic', 'desert', 'toyland']
          )
          state.raw.dedicated = !!reader.uint(1)
      }
      
      if (version < 7) {
        const DAY_TICKS = 74;
        state.raw.ticks_playing = (new Date(state.raw.date_current).getTime() - new Date(state.raw.date_start).getTime()) / 1000 / 3600 / 24 * DAY_TICKS + 1280; //1280 looks like initial ticks after server start
      }
    }

    /**
     * this doesnt work with the current version of openttd and causes timeouts
     * leaving it here for the case that it will be fixed in the future
     */
    // {
    //   const [reader, version] = await this.query(2, 3, -1, -1)
    //   // we don't know how to deal with companies outside version 6
    //   if (version === 6) {
    //     state.raw.companies = []
    //     const numCompanies = reader.uint(1)
    //     for (let iCompany = 0; iCompany < numCompanies; iCompany++) {
    //       const company = {}
    //       company.id = reader.uint(1)
    //       company.name = reader.string()
    //       company.year_start = reader.uint(4)
    //       company.value = reader.uint(8).toString()
    //       company.money = reader.uint(8).toString()
    //       company.income = reader.uint(8).toString()
    //       company.performance = reader.uint(2)
    //       company.password = !!reader.uint(1)

    //       const vehicleTypes = ['train', 'truck', 'bus', 'aircraft', 'ship']
    //       const stationTypes = ['station', 'truckbay', 'busstation', 'airport', 'dock']

    //       company.vehicles = {}
    //       for (const type of vehicleTypes) {
    //         company.vehicles[type] = reader.uint(2)
    //       }
    //       company.stations = {}
    //       for (const type of stationTypes) {
    //         company.stations[type] = reader.uint(2)
    //       }

    //       company.clients = reader.string()
    //       state.raw.companies.push(company)
    //     }
    //   }
    // }
  }

  async query (type, expected, minver, maxver) {
    const b = Buffer.from([0x03, 0x00, type])
    return await this.withTcp(async socket => {
      return await this.tcpSend(socket, b, (buffer) => {
        const reader = this.reader(buffer)
        const packetLen = reader.uint(2)
        if (packetLen !== buffer.length) {
          this.logger.debug('Invalid reported packet length: ' + packetLen + ' ' + buffer.length)
          return
        }

        const packetType = reader.uint(1)
        if (packetType !== expected) {
          this.logger.debug('Unexpected response packet type: ' + packetType)
          return
        }

        const protocolVersion = reader.uint(1)
        if ((minver !== -1 && protocolVersion < minver) || (maxver !== -1 && protocolVersion > maxver)) {
          throw new Error('Unknown protocol version: ' + protocolVersion + ' Expected: ' + minver + '-' + maxver)
        }

        return [reader, protocolVersion]
      })
    })
  }

  readDate (reader) {
    const daysSinceZero = reader.uint(4)
    const temp = new Date(0, 0, 1)
    temp.setFullYear(0)
    temp.setDate(daysSinceZero + 2) // to show correct date here must be +2
    return temp.toISOString().split('T')[0]
  }

  readOldDate(reader) {
    const DAYS_TILL_ORIGIANAL_BASE_YEAR = 365 * 500 + 125
    const daysSinceZero = DAYS_TILL_ORIGIANAL_BASE_YEAR + reader.uint(2)
    const temp = new Date(0, 0, 1)
    temp.setFullYear(0) //not sure about this - no option to test it
    temp.setDate(daysSinceZero + 2)
    return temp.toISOString().split('T')[0]
  }

  decode (num, arr) {
    if (num < 0 || num >= arr.length) {
      return num
    }
    return arr[num]
  }
}

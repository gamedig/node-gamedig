import test from 'ava'
import { makeServer } from '../http_server.js'
import { GameDig } from '../../lib/index.js'

const goodResponse = '{"Info":{"External":false,"WebPort":3001,"IsLAN":false,"Description":"SoMKaT & Friends","DetailedDescription":"Join Discord: www.dc.somkat.net","Category":"None","OnlinePlayers":0,"TotalPlayers":7,"OnlinePlayersNames":[] ,"AdminOnline":false,"DaysRunning":13,"DaysUntilMeteor":76,"Animals":6278,"Plants":560028,"Laws":0,"WorldSize":"1.96 km²","Version":"0.11.0.2 beta release-707","EconomyDesc":"44 Händel, 0 Verträge","Language":"German","H asPassword":false,"HasMeteor":true,"DistributionStationItems":"Keine","Playtimes":"","DiscordAddress":"https://discord.gg/Etfmc7u","IsPaused":false,"ActiveAndOnlinePlayers":3,"PeakActivePlayers":4,"ShelfLifeMultiplier":1 ,"ExhaustionAfterHours":3,"ExhaustionActive":false,"ExhaustionAllowPlaytimeSaving":true,"ExhaustionMaxSavedHours":15,"ExhaustionBonusHoursOnExhaustionEnabled":2,"ExhaustionBonusRetroactiveHoursAfterStart":true,"Exhaustio nHoursGainPerWeekday":{"0":6,"1":3,"2":3,"3":3,"4":3,"5":6,"6":6},"ServerAchievementsDict":{},"CollaborationLevel":"LowCollaboration","GameSpeed":"Normal","SimulationLevel":"Normal","TotalCulture":0,"PremiumItemUseRestrictions":false,"PremiumItemsBlocked":false,"RelayAddress":"3.123.89.127:3300","Access":"public"},"Graphs":[]}'
const expectedResponse = {
  bots: [],
  connect: 'eco.somkat.net:3001',
  map: '',
  maxplayers: 7,
  name: 'SoMKaT & Friends',
  numplayers: 0,
  password: false,
  ping: 1,
  players: [],
  queryPort: 3001,
  raw: {
    Access: 'public',
    ActiveAndOnlinePlayers: 3,
    AdminOnline: false,
    Animals: 6278,
    Category: 'None',
    CollaborationLevel: 'LowCollaboration',
    DaysRunning: 13,
    DaysUntilMeteor: 76,
    Description: 'SoMKaT & Friends',
    DetailedDescription: 'Join Discord: www.dc.somkat.net',
    DiscordAddress: 'https://discord.gg/Etfmc7u',
    DistributionStationItems: 'Keine',
    EconomyDesc: '44 Händel, 0 Verträge',
    ExhaustionActive: false,
    ExhaustionAfterHours: 3,
    ExhaustionAllowPlaytimeSaving: true,
    ExhaustionBonusHoursOnExhaustionEnabled: 2,
    ExhaustionBonusRetroactiveHoursAfterStart: true,
    ExhaustionHoursGainPerWeekday: {
      0: 6,
      1: 3,
      2: 3,
      3: 3,
      4: 3,
      5: 6,
      6: 6
    },
    ExhaustionMaxSavedHours: 15,
    External: false,
    GameSpeed: 'Normal',
    HasMeteor: true,
    HasPassword: false,
    IsLAN: false,
    IsPaused: false,
    Language: 'German',
    Laws: 0,
    'Online Players': 0,
    OnlinePlayersNames: [],
    PeakActivePlayers: 4,
    Plants: 560028,
    Playtimes: '',
    PremiumItemUseRestrictions: false,
    PremiumItemsBlocked: false,
    RelayAddress: '3.123.89.127:3300',
    ServerAchievementsDict: {},
    ShelfLifeMultiplier: 1,
    SimulationLevel: 'Normal',
    TotalCulture: 0,
    TotalPlayers: 7,
    Version: '0.11.0.2 beta release-707',
    WebPort: 3001,
    WorldSize: '1.96 km²'
  },
  version: '0.11.0.2 beta release-707'
}

test.before(async ({ context }) => {
  const [port, close] = await makeServer({ method: 'GET', url: 'frontpage', response: goodResponse })
  context.port = port
  context.close = close
})

test.after.always(async ({ context }) => {
  await context.close()
})

test('eco ok', async ({ context, is }) => {
  const response = await GameDig.query({
    type: 'eco',
    host: 'localhost',
    port: context.port
  })

  is(response, expectedResponse)
})

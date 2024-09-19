import valve from './valve.js'
// import { TranslateMapUT3 } from './ut3.js'

export const TranslateMapToxikk = Object.freeze({
  // add UT3 values
  // Toxikk is using UDK which includes basic implementation of UT3
  // ...TranslateMapUT3,

  // Old UT3/UDK properties
  p1073741825: 'map', // UC Source='CRZMapName'
  p1073741826: 'game', // UC Source='CustomGameMode'
  p268435704: 'frag_limit', // UC Source='TimeLimit'
  p268435705: 'time_limit', // UC Source='TimeLimit'
  p268435703: 'numbots',
  p1073741827: 'servername', // UC Source='ServerDescription'
  p268435717: false, // 'stock_mutators' // UC Source='OfficialMutators' // Note: "EpicMutators" are bit-masked and require Full UE3 license (C++) to flag mutators, stock mutators could be always 0, ignore for now
  p1073741828: 'custom_mutators', // UC Source='CustomMutators'

  // Toxikk specific localized settings (commented name is based on source code)
  s32779: 'GameMode', // 8=Custom, anything else is UT3/UDK
  s0: 'bot_skill', // UC Source='BotSkill', // 0=Ridiculous  1=Novice  2=Average  3=Experienced  4=Adept  5=Masterful  6=Inhuman  7=Godlike
  s1: false, // UC Source='Map' // Note: set as '0' mostly, generally the index will state the official map, ignore for now
  s6: 'pure_server', // UC Source='PureServer', // bool
  s7: 'password', // UC Source='LockedServer', // bool
  s8: 'vs_bots', // UC Source='VsBots', // 0=Disabled  1="2:1"  2="1:1"  3="2:3"  4="1:2"  5="1:3"  6="1:4"
  s9: 'Campaign', // bool
  s10: 'force_respawn', // UC Source='ForceRespawn', // bool
  s11: 'AllowKeyboard', // bool
  s12: 'IsFullServer', // bool
  s13: 'IsEmptyServer', // bool
  s14: 'IsDedicated', // bool
  s15: 'RankedServer', // 0=UnRanked  1=Ranked
  s16: 'OnlyFullGamePlayers', // bool
  s17: 'IgnoredByMatchmaking', // bool
  s18: 'OfficialServer', // 0=Community  1=Official
  s19: 'ModdingLevel', // 0=Unmodded  1=Server Modded  2=Client Modded

  // Toxikk properties
  p268435706: 'MaxPlayers',
  p268435707: 'MinNetPlayers',
  p268435708: 'MinSkillClass',
  p268435709: 'MaxSkillClass',
  p1073741829: 'PLAYERIDS1',
  p1073741830: 'PLAYERIDS2',
  p1073741831: 'PLAYERIDS3',
  p1073741832: 'PLAYERNAMES1',
  p1073741833: 'PLAYERNAMES2',
  p1073741834: 'PLAYERNAMES3',
  p1073741837: 'PLAYERSCS',
  p1073741838: 'PLAYERBadgeRanks',
  p1073741839: 'GameVersion',
  p1073741840: 'GameVoteList'
})

/**
 * Implements the protocol for Toxikk, an UnrealEngine3 based game,
 * using Valve protocol for query with additional UE3 properties/settings parsing
 */
export default class toxikk extends valve {
  async run (state) {
    if (!this.options.port) this.options.port = 27015
    await this.queryInfo(state)
    await this.queryChallenge()
    await this.queryPlayers(state)
    await this.queryRules(state)

    this.processQueryInfo(state)
    await this.cleanup(state)
  }

  /** @override */
  async cleanup (state) {
    // valve protocol attempts to put "hidden players" into player/bot array
    // the bot data is not properly queried, therefore prevent push players into bots-array
    const originalNumBots = state.raw.numbots
    state.raw.numbots = null
    super.cleanup(state)
    state.raw.numbots = originalNumBots
  }

  async queryRules (state) {
    if (!this.options.requestRules) {
      return
    }

    const rules = {}
    this.logger.debug('Requesting rules ...')

    const b = await this.sendPacket(0x56, null, 0x45, true)
    if (b === null && !this.options.requestRulesRequired) return // timed out - the server probably has rules disabled

    const reader = this.reader(b)
    const num = reader.uint(2)
    for (let i = num - 1; i > 0 && !reader.done(); i--) {
      const key = reader.string()
      const value = reader.string()
      if (reader.remaining() <= 0) {
        // data might be corrupt in this case, keep existing rules
        break
      }

      rules[key] = value
    }

    state.raw.rules = rules
  }

  processQueryInfo (state) {
    // move raw rules into root-raw object and attempt to translate properties
    Object.assign(state.raw, state.raw.rules)
    this.translate(state.raw, TranslateMapToxikk)

    const split = (a) => {
      let s = a.split('\x1c')
      s = s.filter((e) => { return e })
      return s
    }
    if ('custom_mutators' in state.raw) state.raw.custom_mutators = split(state.raw.custom_mutators)
    if ('stock_mutators' in state.raw) state.raw.stock_mutators = split(state.raw.stock_mutators)
    if ('map' in state.raw) state.map ??= state.raw.map
  }
}

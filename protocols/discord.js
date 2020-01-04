const Core = require('./core');

class Discord extends Core {
  constructor() {
    super();
    this.dnsResolver = { resolve: function(address) {return {address: address} } };
  }

  async run(state) {
    console.log('SENDING HTTP Request');
    this.usedTcp = true;
    console.log(this.options);
    const raw = await this.request({
      uri: 'https://discordapp.com/api/guilds/' + this.options.address + '/widget.json',
    });
    const json = JSON.parse(raw);
    state.name = json.name;
    if (json.instant_invite) {
      state.connect = json.instant_invite;
    } else {
      state.connect = 'https://discordapp.com/channels/' + this.options.address
    }
    state.players = json.members.map(v => {
      return {
        name: v.username + '#' + v.discriminator,
        username: v.username,
        discriminator: v.discriminator,
        team: v.status
      }
    });
    state.raw = json;
  }
}

module.exports = Discord;

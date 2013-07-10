module.exports = require('./gamespy3').extend({
	init: function() {
		this._super();
		this.options.port = 6500;
	},
	prepState: function(state) {
		this._super(state);

		this.translateState(state,{
			'OwningPlayerName': 'hostname',
			'p1073741825': 'mapname',
			'p1073741826': 'gametype',
			'p1073741827': 'servername',
			'p1073741828': 'custom_mutators',
			'gamemode': 'open',
			's32779': 'gamemode',
			's0': 'bot_skill',
			's6': 'pure_server',
			's7': 'password',
			's8': 'vs_bots',
			's10': 'force_respawn',
			'p268435704': 'frag_limit',
			'p268435705': 'time_limit',
			'p268435703': 'numbots',
			'p268435717': 'stock_mutators',
			's1': false,
			's9': false,
			's11': false,
			's12': false,
			's13': false,
			's14': false
		});
		state['custom_mutators'] = state['custom_mutators'].split('\x1c');
	}
});

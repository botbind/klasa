const { MultiArgument } = require('@botbind/klasa');

module.exports = class extends MultiArgument {

	constructor(...args) {
		super(...args, { aliases: ['...extendable'] });
	}

	get base() {
		return this.store.get('extendable');
	}

};

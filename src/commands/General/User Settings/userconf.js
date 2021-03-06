const { Command, util: { toTitleCase, codeBlock } } = require('@botbind/klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			guarded: true,
			subcommands: true,
			description: language => language.get('COMMAND_CONF_USER_DESCRIPTION'),
			usage: '<set|show|remove|reset> (key:key) (value:value) [...]',
			usageDelim: ' '
		});

		this
			.createCustomResolver('key', (arg, possible, message, [action]) => {
				if (action === 'show' || arg) return arg;
				throw message.language.get('COMMAND_CONF_NOKEY');
			})
			.createCustomResolver('value', (arg, possible, message, [action]) => {
				if (!['set', 'remove'].includes(action) || arg) return arg;
				throw message.language.get('COMMAND_CONF_NOVALUE');
			});
	}

	show(message, [key]) {
		const path = this.client.gateways.users.getPath(key, { avoidUnconfigurable: true, errors: false, piece: null });
		if (!path) return message.sendLocale('COMMAND_CONF_GET_NOEXT', [this.clean(key)]);
		if (path.piece.type === 'Folder') {
			return message.sendLocale('COMMAND_CONF_USER', [
				key ? `: ${key.split('.').map(toTitleCase).join('/')}` : '',
				codeBlock('asciidoc', message.author.settings.list(message, path.piece))
			]);
		}
		return message.sendLocale('COMMAND_CONF_GET', [this.clean(path.piece.path), this.clean(message.author.settings.resolveString(message, path.piece))]);
	}

	async set(message, [key, ...valueToSet]) {
		const status = await message.author.settings.update(key, valueToSet.join(' '), message.guild, { avoidUnconfigurable: true, action: 'add' });
		return this.check(message, key, status) || message.sendLocale('COMMAND_CONF_UPDATED', [this.clean(key), this.clean(message.author.settings.resolveString(message, status.updated[0].piece))]);
	}

	async remove(message, [key, ...valueToRemove]) {
		const status = await message.author.settings.update(key, valueToRemove.join(' '), message.guild, { avoidUnconfigurable: true, action: 'remove' });
		return this.check(message, key, status) || message.sendLocale('COMMAND_CONF_UPDATED', [this.clean(key), this.clean(message.author.settings.resolveString(message, status.updated[0].piece))]);
	}

	async reset(message, [key]) {
		const status = await message.author.settings.reset(key, true);
		return this.check(message, key, status) || message.sendLocale('COMMAND_CONF_RESET', [this.clean(key), this.clean(message.author.settings.resolveString(message, status.updated[0].piece))]);
	}

	check(message, key, { errors, updated }) {
		if (errors.length) return message.sendMessage(this.clean(errors[0]));
		if (!updated.length) return message.sendLocale('COMMAND_CONF_NOCHANGE', [this.clean(key)]);
		return null;
	}

	clean(text) {
		if (typeof text === 'string') return text.replace(/@/g, '@\u200b')
		return text
	}

};

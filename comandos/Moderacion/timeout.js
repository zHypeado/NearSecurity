const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const ms = require('ms');

module.exports = {
	nombre: 'timeout',
	category: 'Moderación',
	premium: false,
	alias: ['t', 'aislar'],
	description: 'Parecido al comando mute, pero usando un sistema oficial de Discord (Aislamiento por usuario).',
	usage: ['<prefix>t <userMention> <timeout> [reason]'],
	run: async (client, message, args, _guild) => {
	    
	            const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
    try {
        const user = await Blacklist.findOne({ userId });
        console.log("Resultado de la búsqueda de blacklist:", user); // Registro para verificar si encuentra al usuario
        
        // Si el usuario existe en la blacklist pero tiene un removedAt definido, ya no está en blacklist
        if (user && user.removedAt == null) {
            return true; // Usuario sigue en la blacklist
        }

        return false; // Usuario no está en blacklist o fue removido
    } catch (err) {
        console.error('Error buscando en la blacklist:', err);
        return false; // En caso de error, asume que no está en blacklist
    }
}
        // Verificar si el usuario está en la blacklist
        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        console.log("¿Está en blacklist?", isBlacklisted); // Registro para ver si detecta correctamente
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }
	    
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

		if(!message.guild.members.me.permissions.has('MODERATE_MEMBERS'))return message.channel.send(`Necesito el permiso para __Moderar miembros__.`);
        if(!message.member.permissions.has('MODERATE_MEMBERS'))return message.channel.send(`Necesitas el permiso para __Moderar miembros__..`);

		let userMention = message.mentions.members.first();
        if(!userMention)return message.reply(await dataRequired('' + LANG.commands.mod.timeout.message1 + '.\n\n' + _guild.configuration.prefix + 't <userMention> <timeout> [reason]'));
        if(userMention.id == client.user.id)return;
		if(userMention.id == message.author.id)return message.reply(`${LANG.commands.mod.timeout.message2}.`);
		if(message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0)return message.reply(`${LANG.commands.mod.timeout.message3}.`);
        if(!userMention.moderatable)return message.reply({ content: `${LANG.commands.mod.timeout.message4}.` });
        if(!args[1])return message.reply(await dataRequired('' + LANG.commands.mod.timeout.message5 + '.\n\n' + _guild.configuration.prefix + 't <userMention> <timeout> [reason]'));

        let time = ms(args[1]);
        if(!time)return message.reply('`Error 006`: No time typed.');
        if(time < ms('10m')) {
            time = ms('10m');
            args[1] = '10m';
        }
        let reason = `${LANG.commands.mod.timeout.message6}.`;
        if(args[2]) reason = args.slice(2).join(' ');

        userMention.timeout(time, `${reason}`).then(() => {
            message.reply({ content: `${LANG.commands.mod.timeout.message7} \`${userMention.user.username}\` ${LANG.commands.mod.timeout.message8} \`${args[1]}\`` });
        }).catch(() => {
            message.reply({ content: `${LANG.commands.mod.timeout.message9} \`${userMention.user.username}\`` });
        });
	},
};
const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'ghostping',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Si un mensaje con una mención es eliminado, el bot repetirá el mensaje para que se vea la mención.',
	usage: ['<prefix>ghostping'],
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

        if(!message.guild.members.me.permissions.has('MANAGE_MESSAGES'))return message.channel.send(`Necesito permisos para __Administrar mensajes__.`);
        if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.moderation.dataModeration.events.ghostping == false) {
            _guild.moderation.dataModeration.events.ghostping = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.ghostping.message1}.` });
        }else{
            if(!_guild.moderation.dataModeration.events.ghostping) {
                _guild.moderation.dataModeration.events.ghostping = false;
                _guild.moderation.automoderator.events.ghostping = false;
            }
            _guild.moderation.dataModeration.events.ghostping = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.mod.ghostping.message2}.` });
        }

    },
}
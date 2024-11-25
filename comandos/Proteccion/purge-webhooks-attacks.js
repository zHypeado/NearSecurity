const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'purge-webhooks-attacks',
	category: 'Protección',
    premium: false,
	alias: ['pwa', 'antiwebhooks'],
	description: 'Haz que el bot detenga todos los posibles raids detectados en el servidor.',
	usage: ['<prefix>purgeWebhooksAttacks'],
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

        if(!message.guild.members.me.permissions.has('MANAGE_WEBHOOKS'))return message.channel.send(`Necesito permisos para __Administrar webhooks__.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(_guild.protection.purgeWebhooksAttacks.enable == false) {
            _guild.protection.purgeWebhooksAttacks.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.pwa.message1}.` });
        }else{
            _guild.protection.purgeWebhooksAttacks.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.pwa.message2}.` });
        }

    },
}
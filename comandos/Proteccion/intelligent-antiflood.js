const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'intelligent-antiflood',
	category: 'Protección',
    premium: false,
	alias: ['intelligentAntiflood', 'intelligentantiflood', 'iflood', 'iantiflood'],
	description: 'Evita mensajes repetidos.',
	usage: ['<prefix>iflood'],
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
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(_guild.protection.intelligentAntiflood == false) {
            _guild.protection.intelligentAntiflood = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.iAntiflood.message1}.` });
        }else{
            _guild.protection.intelligentAntiflood = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.iAntiflood.message2}.` });
        }

    },
}
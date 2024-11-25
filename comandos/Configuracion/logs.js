const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
    nombre: 'logs',
    category: 'Configuración',
    premium: false,
    alias: ['setlogs', 'log'],
    description: 'Registra eventos en tu servidor dentro de un canal.',
    usage: ['<prefix>logs {enable <channelMention>, disable}'],
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
        
        if (!message.member.permissions.has('ADMINISTRATOR')) 
            return message.reply('No tienes permisos suficientes para usar este comando.');

        if (!args[0]) 
            return message.reply(`Uso incorrecto. Utiliza ${_guild.configuration.prefix}logs <enable <channelMention> | disable>`);

        if (args[0] === 'enable') {
            if (_guild.configuration.logs[0]) 
                return message.reply('El registro ya está habilitado en otro canal.');

            let channelMention = message.mentions.channels.first();
            if (!channelMention) 
                return message.reply(`Debes mencionar un canal válido. Uso: ${_guild.configuration.prefix}logs enable <canal>`);
            
            if (channelMention.type !== 'GUILD_TEXT') 
                return message.reply(`El canal mencionado no es de texto. Uso: ${_guild.configuration.prefix}logs enable <canal>`);
            
            if (message.guild.channels.cache.has(channelMention.id)) {
                if (!channelMention.parentId) 
                    return message.reply('El canal mencionado no tiene una categoría.');
                
                _guild.configuration.logs = [channelMention.id, message.channel.id];
                updateDataBase(client, message.guild, _guild, true);
                message.reply('El registro de eventos ha sido habilitado en el canal mencionado.');
            } else {
                message.reply(`El canal mencionado no existe. Uso: ${_guild.configuration.prefix}logs enable <canal>`);
            }
        } else if (args[0] === 'disable') {
            if (!_guild.configuration.logs[0]) 
                return message.reply('El registro de eventos no está habilitado.');

            _guild.configuration.logs = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply('El registro de eventos ha sido deshabilitado.');
        } else {
            message.reply(`Uso incorrecto. Utiliza ${_guild.configuration.prefix}logs <enable <canal> | disable>`);
        }
    },
};
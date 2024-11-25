const Discord = require('discord.js-light');
const { updateDataBase, fecthDataBase } = require('../../functions');

module.exports = {
    nombre: 'antichannels',
    category: 'Protección',
    premium: false,
    alias: [],
    description: 'Evita la creación y eliminación no autorizada de canales en el servidor.',
    usage: ['<prefix>antichannels'],
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
        
        const LANG = {
            activate: "El sistema de anticanales ha sido activado.",
            deactivate: "El sistema de anticanales ha sido desactivado.",
            permissionError: "Necesito permisos para __Banear miembros__.",
            ownerError: "Este comando solo puede ser usado por el propietario del servidor."
        };

        // Verificar permisos
        if (!message.guild.members.me.permissions.has('BAN_MEMBERS')) {
            return message.reply(LANG.permissionError);
        }
        if (message.author.id !== message.guild.ownerId) {
            return message.reply(LANG.ownerError);
        }

        // Alternar el sistema antichannels
        _guild.protection.antichannels.enable = !_guild.protection.antichannels.enable;

        if (_guild.protection.antichannels.enable) {
            await updateDataBase(client, message.guild, _guild, true);
            message.reply(LANG.activate);
        } else {
            await updateDataBase(client, message.guild, _guild, true);
            message.reply(LANG.deactivate);
        }
    },
};
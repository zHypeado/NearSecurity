const Discord = require('discord.js-light');
const Guild = require('../../schemas/guildsSchema');

module.exports = {
    nombre: 'antiwebhook',
    category: 'Protección',
    premium: false,
    alias: [],
    description: 'Sistema para evitar la creación de webhooks.',
    usage: ['<prefix>antiwebhook [maxWebhooks]'],
    run: async (client, message, args) => {
        
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
        
        if (!message.guild.members.me.permissions.has('MANAGE_WEBHOOKS')) {
            return message.channel.send('Necesitas permiso de __Administrar webhooks__.');
        }
        if (message.author.id != message.guild.ownerId) {
            return message.reply({ content: 'Solo el propietario del servidor puede utilizar este comando.' });
        }

        // Obtener datos del servidor desde MongoDB
        let guildData = await Guild.findOne({ id: message.guild.id });
        if (!guildData) {
            guildData = new Guild({ id: message.guild.id, ownerId: message.guild.ownerId });
        }

        // Inicializar antiwebhook si no existe
        if (!guildData.protection) {
            guildData.protection = {};
        }
        if (!guildData.protection.antiwebhook) {
            guildData.protection.antiwebhook = {
                enable: false,
                maxWebhooks: 5 // Valor por defecto
            };
        }

        // Actualizar el límite de webhooks si se proporciona un argumento
        if (args[0]) {
            const newLimit = parseInt(args[0]);
            if (isNaN(newLimit)) {
                return message.reply({ content: 'Por favor, ingresa un número válido para el límite máximo de webhooks.' });
            }
            guildData.protection.antiwebhook.maxWebhooks = newLimit;
            await guildData.save();
            return message.reply({ content: `El límite máximo de webhooks ha sido actualizado a ${newLimit}.` });
        } else {
            // Activar o desactivar el sistema antiwebhook
            guildData.protection.antiwebhook.enable = !guildData.protection.antiwebhook.enable;
            const status = guildData.protection.antiwebhook.enable ? 'activado' : 'desactivado';
            await guildData.save();
            return message.reply({ content: `El sistema antiwebhook ha sido ${status}.` });
        }
    },
};
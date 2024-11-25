const Discord = require('discord.js-light');

module.exports = {
    name: 'leave',
    category: 'Admin',
    premium: false,
    alias: ['exit', 'remove'],
    description: 'Permite al bot abandonar un servidor.',
    usage: ['<prefix>leave <serverId>'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Verificar si el usuario tiene el rol requerido en el servidor especificado
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        // Verificar si se proporciona un ID de servidor
        if (args.length < 1) {
            return message.channel.send('Por favor, proporciona el ID del servidor del que deseas que el bot se salga.');
        }

        const serverId = args[0];
        const guild = client.guilds.cache.get(serverId);

        if (!guild) {
            return message.channel.send('No se pudo encontrar el servidor con el ID proporcionado.');
        }

        try {
            await guild.leave();
            message.channel.send(`El bot ha abandonado el servidor con ID: ${serverId}`);
        } catch (error) {
            console.error(`Error al abandonar el servidor: ${error}`);
            message.channel.send('Hubo un error al intentar abandonar el servidor.');
        }
    },
};
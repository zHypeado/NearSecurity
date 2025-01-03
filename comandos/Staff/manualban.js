const Discord = require('discord.js-light');

module.exports = {
    name: 'manualban',
    category: 'Admin',
    premium: false,
    alias: ['banid'],
    description: 'Permite banear a un usuario en un servidor específico usando la ID del usuario y del servidor.',
    usage: ['<prefix>manualban <serverId> <userId> [reason]'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Verificar si el usuario tiene el rol requerido en el servidor especificado
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        // Verificar si se proporcionan las IDs necesarias
        if (args.length < 2) {
            return message.channel.send('Por favor, proporciona la ID del servidor y la ID del usuario que deseas banear.');
        }

        const serverId = args[0];
        const userId = args[1];
        const reason = args.slice(2).join(' ') || 'Sin razón especificada';

        // Obtener el servidor
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return message.channel.send('No se pudo encontrar el servidor con la ID proporcionada.');
        }

        try {
            // Intentar banear al usuario
            const user = await client.users.fetch(userId); // Obtener el usuario por ID
            await guild.members.ban(user, { reason });
            message.channel.send(`El usuario ${user.tag} ha sido baneado del servidor con ID: ${serverId} por la razón: ${reason}`);
        } catch (error) {
            console.error(`Error al banear al usuario: ${error}`);
            message.channel.send('Hubo un error al intentar banear al usuario. Asegúrate de que el bot tenga permisos para banear en ese servidor.');
        }
    },
};
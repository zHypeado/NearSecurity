const Discord = require('discord.js-light');

module.exports = {
    name: 'manualunban',
    category: 'Admin',
    premium: false,
    alias: ['unbanid'],
    description: 'Permite desbanear a un usuario en un servidor específico usando la ID del usuario y del servidor.',
    usage: ['<prefix>manualunban <serverId> <userId>'],
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
            return message.channel.send('Por favor, proporciona la ID del servidor y la ID del usuario que deseas desbanear.');
        }

        const serverId = args[0];
        const userId = args[1];

        // Obtener el servidor
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return message.channel.send('No se pudo encontrar el servidor con la ID proporcionada.');
        }

        try {
            // Intentar desbanear al usuario
            const user = await client.users.fetch(userId); // Obtener el usuario por ID
            await guild.members.unban(userId);
            message.channel.send(`El usuario ${user.tag} ha sido desbaneado del servidor con ID: ${serverId}`);
        } catch (error) {
            console.error(`Error al desbanear al usuario: ${error}`);
            message.channel.send('Hubo un error al intentar desbanear al usuario. Asegúrate de que el bot tenga permisos para desbanear en ese servidor.');
        }
    },
};
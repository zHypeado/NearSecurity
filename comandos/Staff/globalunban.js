const Discord = require('discord.js-light');

module.exports = {
    name: 'globalunban',
    category: 'Moderación',
    premium: false,
    alias: ['gunban', 'unbanall'],
    description: 'Desbanea a un usuario de todos los servidores en los que está el bot usando su ID.',
    usage: ['<prefix>globalunban <userID>'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido (Staff)
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor permitido (Guild donde está el rol)

        // Verificar si el usuario tiene el rol de staff en el servidor permitido
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasStaffRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasStaffRole) {
            return message.reply('No tienes permisos suficientes para usar este comando. Solo el equipo de staff puede usar este comando.');
        }

        // Obtener el ID del usuario a desbanear
        const userId = args[0];
        if (!userId) {
            return message.reply('Debes proporcionar un ID de usuario para desbanearlo globalmente.');
        }

        // Iterar sobre los servidores del bot y desbanear al usuario en cada uno
        const guilds = client.guilds.cache;
        let unbanCount = 0;

        guilds.forEach(async (guild) => {
            try {
                // Buscar el ban del usuario
                const ban = await guild.bans.fetch(userId);
                if (ban) {
                    await guild.bans.remove(userId, `Globalunban solicitado por ${message.author.tag}`);
                    unbanCount++;
                }
            } catch (error) {
                console.log(`No se pudo desbanear en ${guild.name}:`, error.message);
            }
        });

        // Responder al usuario una vez que se haya intentado desbanear en todos los servidores
        message.channel.send(`Se ha desbaneado al usuario con ID **${userId}** de ${unbanCount} servidores.`);
    }
};
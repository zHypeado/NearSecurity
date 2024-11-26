const Discord = require('discord.js-light');

module.exports = {
    name: 'staff-invite',
    category: 'Staff',
    premium: false,
    alias: ['sinvite'],
    description: 'Crea una invitación para el servidor especificado por su ID.',
    usage: ['<prefix>staff-invite <serverId>'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE-ID'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER-ID'; // ID del servidor donde se encuentra el rol

        // Verificar si el usuario tiene el rol requerido
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        // Verificar si se proporciona un ID de servidor
        if (!args.length) {
            return message.channel.send('Por favor, proporciona la ID del servidor para crear la invitación.');
        }

        const serverId = args[0];
        const guild = client.guilds.cache.get(serverId);

        if (!guild) {
            return message.channel.send('No se pudo encontrar el servidor con la ID proporcionada.');
        }

        try {
            // Intentar crear una invitación en el primer canal disponible
            const channel = guild.channels.cache.find(ch =>
                ch.isText() && ch.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE')
            );

            if (!channel) {
                return message.channel.send(`Servidor encontrado: **${guild.name}**, pero no se pudo crear una invitación (no hay canales disponibles).`);
            }

            const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });

            // Crear un embed con los detalles de la invitación
            const inviteEmbed = new Discord.MessageEmbed()
                .setColor('#F0F0F0')
                .setTitle('Invitación Creada')
                .setDescription(`Se ha generado una invitación para el servidor **${guild.name}**.`)
                .addField('🔗 Enlace de Invitación:', `[Click aquí para unirte](${invite.url})`)
                .addField('📋 Detalles del Servidor:', `**ID:** ${guild.id}\n**Miembros:** ${guild.memberCount}`)
                .setFooter({ text: 'NearSecurity', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Crear un botón con el enlace de la invitación
            const inviteButton = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setLabel(`Unirse a ${guild.name}`)
                    .setStyle('LINK')
                    .setURL(invite.url)
            );

            // Enviar el embed y el botón
            message.channel.send({ embeds: [inviteEmbed], components: [inviteButton] });
        } catch (error) {
            console.error(`Error al crear la invitación: ${error.message}`);
            message.channel.send('Hubo un error al intentar crear la invitación.');
        }
    },
};

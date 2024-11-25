const { MessageEmbed } = require('discord.js-light');

module.exports = {
    name: 'broadcast',
    category: 'Admin',
    alias: ['bc', 'sendall'],
    description: 'Envía un mensaje a todos los servidores donde está el bot.',
    usage: ['n!broadcast <mensaje>'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Verificar si el usuario tiene el rol de staff en el servidor permitido
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        // Verificar si se ha proporcionado un mensaje
        const broadcastMessage = args.join(' ');
        if (!broadcastMessage) {
            return message.channel.send('Por favor, proporciona el mensaje que deseas enviar.');
        }

        // Crear un embed para el mensaje
        const embed = new MessageEmbed()
            .setTitle('<:Info:1280303272472875021> Anuncio Global')
            .setDescription(broadcastMessage)
            .setColor('BLUE')
            .setFooter(`NearSecurity | Por ${message.author.tag}`, message.author.displayAvatarURL())

        // Enviar el mensaje a todos los servidores donde está el bot
        client.guilds.cache.forEach(guild => {
            const defaultChannel = guild.channels.cache.find(channel => 
                channel.type === 'GUILD_TEXT' && 
                channel.permissionsFor(guild.me).has('SEND_MESSAGES')
            );
            if (defaultChannel) {
                defaultChannel.send({ embeds: [embed] }).catch(err => console.error(`No se pudo enviar mensaje a ${guild.name}: ${err}`));
            }
        });

        // Confirmación al usuario que ejecutó el comando
        message.channel.send('Mensaje enviado a todos los servidores.');
    }
};
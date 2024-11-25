const Discord = require('discord.js');

module.exports = {
    name: 'stafflist',
    category: 'Información',
    premium: false,
    alias: ['liststaff', 'staffmembers'],
    description: 'Lista todos los miembros del equipo de staff en el servidor.',
    usage: ['<prefix>listarstaff'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol del staff
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor permitido

        // Verifica que el comando se ejecute en el servidor permitido
        if (message.guild.id !== allowedGuildId) {
            return message.reply('Este comando solo se puede ejecutar en el servidor autorizado.');
        }

        try {
            // Obtener el rol
            const role = message.guild.roles.cache.get(requiredRoleId);

            if (!role) {
                return message.reply('El rol de staff no fue encontrado en este servidor.');
            }

            // Obtener los miembros que tienen el rol de staff
            const membersWithRole = role.members.map(member => `<@${member.user.id}> (ID: ${member.id})`);

            if (membersWithRole.length === 0) {
                return message.reply(`No hay miembros del equipo de staff con el rol ${role}.`);
            }

            // Crear un embed con la lista de miembros y mencionar el rol
            const embed = new Discord.MessageEmbed()
                .setTitle('<:Members:1278539258692374591> | Miembros del equipo de Staff')
                .setColor('#FFFFFF') // Color blanco permanente
                .setDescription(`${membersWithRole.join('\n')}`)
                .setFooter('NearSecurity');

            message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error al listar los miembros del staff:', error);
            message.channel.send('Hubo un error al intentar listar los miembros del staff.');
        }
    }
};
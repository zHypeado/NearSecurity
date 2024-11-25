const Discord = require('discord.js-light');

module.exports = {
    nombre: 'servidores',
    category: 'Información',
    premium: false,
    alias: ['servers', 'guilds'],
    description: 'Muestra los servidores en los que está el bot, la cantidad de miembros y el ID de cada servidor.',
    usage: ['<prefix>servidores'],
    run: async (client, message, args, _guild) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Check if the user has the required role in the specified guild
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        const guilds = client.guilds.cache.map(guild => ({
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount
        }));

        if (guilds.length === 0) {
            return message.channel.send('El bot no está en ningún servidor.');
        }

        const itemsPerPage = 5; // Número de servidores por página
        const pages = Math.ceil(guilds.length / itemsPerPage);
        let page = 1;

        // Función para generar el embed para una página específica
        const generateEmbed = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = page * itemsPerPage;
            const currentPageGuilds = guilds.slice(start, end);

            return new Discord.MessageEmbed()
                .setColor("#FDFDFD")
                .setTitle('Servidores en los que estoy:')
                .setDescription(currentPageGuilds.map(g => `**${g.name}**\nID: ${g.id}\nMiembros: ${g.memberCount}`).join('\n\n'))
                .setFooter(`Página ${page} de ${pages} | NearSecurity`);
        };

        // Crear las opciones del menú desplegable
        const options = [];
        for (let i = 1; i <= pages; i++) {
            options.push({
                label: `Página ${i}`,
                value: i.toString(),
                description: `Ver información de la página ${i}`,
                default: i === 1
            });
        }

        const selectMenu = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('pageSelect')
                    .setPlaceholder('Selecciona una página')
                    .addOptions(options)
            );

        const initialEmbed = generateEmbed(page);
        const msg = await message.channel.send({ embeds: [initialEmbed], components: [selectMenu] });

        // Manejar la interacción con el menú desplegable
        const filter = i => i.customId === 'pageSelect' && i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            page = parseInt(i.values[0]);
            const newEmbed = generateEmbed(page);
            await i.update({ embeds: [newEmbed], components: [selectMenu] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.edit({ components: [] }); // Eliminar el menú desplegable después de que expire el tiempo
            }
        });
    }
};

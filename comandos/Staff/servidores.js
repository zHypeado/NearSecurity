const Discord = require('discord.js-light');
const axios = require('axios');

module.exports = {
    nombre: 'servidores',
    category: 'Información',
    premium: false,
    alias: ['servers', 'guilds'],
    description: 'Muestra los servidores en los que está el bot, ordenados por cantidad de miembros y permite buscar servidores.',
    usage: ['<prefix>servidores'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE-ID';
        const allowedGuildId = 'YOUR-STAFF-SERVER-ID';

        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        const guilds = client.guilds.cache
            .map(guild => ({
                name: guild.name,
                id: guild.id,
                memberCount: guild.memberCount
            }))
            .sort((a, b) => b.memberCount - a.memberCount);

        const itemsPerPage = 5; // Servidores por página
        const pages = Math.ceil(guilds.length / itemsPerPage);
        let page = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = page * itemsPerPage;
            const currentPageGuilds = guilds.slice(start, end);

            const embed = new Discord.MessageEmbed()
                .setColor('#F0F0F0')
                .setTitle('Servidores en los que estoy:')
                .setFooter({ text: `Página ${page} de ${pages}`, iconURL: client.user.displayAvatarURL() });

            currentPageGuilds.forEach(g => {
                embed.addField(
                    g.name,
                    `ID: ${g.id}\nMiembros: ${g.memberCount}`,
                    false
                );
            });

            return embed;
        };

        const pasteContent = guilds.map(g => `Servidor: ${g.name} | ID: ${g.id} | Miembros: ${g.memberCount}`).join('\n');

        // Subir la lista a Pastebin
        let pasteUrl = null;
        try {
            const response = await axios.post('https://pastebin.com/api/api_post.php', null, {
                params: {
                    api_dev_key: "YOUR-PASTEBIN-API-KEY", // PON AQUI TU API KEY, NO SEAS PENDEJO 
                    api_option: 'paste',
                    api_paste_code: pasteContent,
                    api_paste_private: 1,
                    api_paste_expire_date: '1H',
                    api_paste_name: 'Lista de Servidores',
                },
            });
            pasteUrl = response.data; // Asignar la URL correcta de Pastebin
        } catch (error) {
            console.error('Error al subir a Pastebin:', error);
            pasteUrl = null; // Si hay error, dejamos pasteUrl como null
        }

        const buttonsRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('searchServer')
                    .setLabel('Buscar')
                    .setStyle('PRIMARY')
            );

        const menuRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('pageSelect')
                    .setPlaceholder('Selecciona una página')
                    .addOptions(
                        Array.from({ length: pages }, (_, i) => ({
                            label: `Página ${i + 1}`,
                            value: (i + 1).toString(),
                            description: `Ver información de la página ${i + 1}`
                        }))
                    )
            );

        // Crear un botón solo si pasteUrl tiene un enlace válido
        const pastebinButtonRow = pasteUrl 
            ? new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setLabel('Ver lista completa en Pastebin')
                        .setStyle('LINK')
                        .setURL(pasteUrl) // Aseguramos que la URL sea válida
                )
            : null; // Si no hay URL válida, no agregamos el botón

        const initialEmbed = generateEmbed(page);

        const msg = await message.channel.send({
            embeds: [initialEmbed],
            components: [buttonsRow, menuRow, pastebinButtonRow].filter(Boolean) // Filtramos los nulls
        });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.isButton() && interaction.customId === 'searchServer') {
                await interaction.reply({ content: 'Escribe el nombre o ID del servidor que deseas buscar:', ephemeral: false });

                const messageFilter = response => response.author.id === message.author.id;
                const collected = await message.channel.awaitMessages({ filter: messageFilter, max: 1, time: 30000 });
                const searchQuery = collected.first()?.content.toLowerCase();

                if (!searchQuery) {
                    return interaction.followUp({ content: 'No escribiste nada, búsqueda cancelada.', ephemeral: false });
                }

                const searchResults = guilds.filter(
                    g => g.name.toLowerCase().includes(searchQuery) || g.id.includes(searchQuery)
                );

                if (searchResults.length === 0) {
                    return interaction.followUp({ content: 'No se encontraron servidores con ese nombre o ID.', ephemeral: false });
                }

                const searchEmbed = new Discord.MessageEmbed()
                    .setColor('#F0F0F0')
                    .setTitle('Resultados de la búsqueda:')
                    .setDescription(searchResults.map(g => `**${g.name}**\nID: ${g.id}\nMiembros: ${g.memberCount}`).join('\n\n'))
                    .setFooter({ text: `Se encontraron ${searchResults.length} resultados.`, iconURL: client.user.displayAvatarURL() });

                interaction.followUp({ embeds: [searchEmbed], ephemeral: false });
            } else if (interaction.isSelectMenu() && interaction.customId === 'pageSelect') {
                page = parseInt(interaction.values[0]);
                const newEmbed = generateEmbed(page);
                await interaction.update({ embeds: [newEmbed], components: [buttonsRow, menuRow, pastebinButtonRow].filter(Boolean) });
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    },
};

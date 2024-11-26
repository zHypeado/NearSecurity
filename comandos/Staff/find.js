const Discord = require('discord.js-light');

module.exports = {
    name: 'find',
    category: 'Staff',
    premium: false,
    alias: ['sfind'],
    description: 'Busca a un usuario por tag o ID en los servidores donde está el bot.',
    usage: ['<prefix>find <userid|tag> <value>'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE-ID';
        const allowedGuildId = 'YOUR-STAFF-SERVER-ID';

        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        if (args.length < 2) {
            return message.channel.send('Uso incorrecto. Usa: `n!find <userid|tag> <valor>`.');
        }

        const subcommand = args[0].toLowerCase();
        const query = args[1];
        let foundUsers = [];

        if (!['userid', 'tag'].includes(subcommand)) {
            return message.channel.send('Subcomando inválido. Usa `userid` o `tag`.');
        }

        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const user = guild.members.cache.find(member =>
                    subcommand === 'userid' ? member.user.id === query : member.user.tag === query
                );

                if (user) {
                    foundUsers.push({ user, guild });
                }
            } catch (error) {
                console.error(`Error buscando en el servidor ${guild.name}: ${error.message}`);
            }
        }

        if (foundUsers.length === 0) {
            return message.channel.send('No se encontró al usuario en ningún servidor donde está el bot.');
        }

        const itemsPerPage = 10; // Servidores por página
        const pages = Math.ceil(foundUsers.length / itemsPerPage); // Total de páginas
        let page = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = page * itemsPerPage;
            const currentPageUsers = foundUsers.slice(start, end);

            const embed = new Discord.MessageEmbed()
                .setColor('#F0F0F0')
                .setTitle('Usuarios Encontrados')
                .setDescription(currentPageUsers.map(({ user, guild }) => `**${user.user.tag}** (ID: \`${user.user.id}\`) en **${guild.name}**`).join('\n'))
                .setFooter({ text: `Página ${page} de ${pages}`, iconURL: client.user.displayAvatarURL() });

            return embed;
        };

        const buttonsRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('searchUser')
                    .setLabel('Buscar en servidores')
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

        const initialEmbed = generateEmbed(page);
        const msg = await message.channel.send({ embeds: [initialEmbed], components: [buttonsRow, menuRow] });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.isButton() && interaction.customId === 'searchUser') {
                await interaction.reply({ content: 'Escribe el tag o ID del usuario que deseas buscar entre los servidores donde está:', ephemeral: false });

                const messageFilter = response => response.author.id === message.author.id;
                const collected = await message.channel.awaitMessages({ filter: messageFilter, max: 1, time: 30000 });
                const searchQuery = collected.first()?.content.toLowerCase();

                if (!searchQuery) {
                    return interaction.followUp({ content: 'No escribiste nada, búsqueda cancelada.', ephemeral: false });
                }

                // Filtra los usuarios en base al query
                const searchResults = foundUsers.filter(
                    ({ user }) => user.user.tag.toLowerCase().includes(searchQuery) || user.user.id.includes(searchQuery)
                );

                if (searchResults.length === 0) {
                    return interaction.followUp({ content: 'No se encontraron usuarios con ese tag o ID entre los servidores donde está el bot.', ephemeral: false });
                }

                const searchEmbed = new Discord.MessageEmbed()
                    .setColor('#F0F0F0')
                    .setTitle('Resultados de la búsqueda:')
                    .setDescription(searchResults.map(({ user, guild }) => `**${user.user.tag}** (ID: \`${user.user.id}\`) en **${guild.name}**`).join('\n'))
                    .setFooter({ text: `Se encontraron ${searchResults.length} resultados.`, iconURL: client.user.displayAvatarURL() });

                interaction.followUp({ embeds: [searchEmbed], ephemeral: false });
            } else if (interaction.isSelectMenu() && interaction.customId === 'pageSelect') {
                page = parseInt(interaction.values[0]);
                const newEmbed = generateEmbed(page);
                await interaction.update({ embeds: [newEmbed], components: [buttonsRow, menuRow] });
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    },
};

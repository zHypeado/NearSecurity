const Discord = require('discord.js');
const Blacklist = require('../../schemas/blacklist'); // Ruta del modelo de blacklist

module.exports = {
    name: 'detectar',
    category: 'Moderación',
    premium: false,
    alias: ['detect', 'verblacklist'],
    description: 'Detecta y muestra usuarios en la blacklist del servidor.',
    usage: ['<prefix>detectar'],
    run: async (client, message, args) => {
        
                const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
    try {
        const user = await Blacklist.findOne({ userId });
        console.log("Resultado de la búsqueda de blacklist:", user); // Registro para verificar si encuentra al usuario
        
        // Si el usuario existe en la blacklist pero tiene un removedAt definido, ya no está en blacklist
        if (user && user.removedAt == null) {
            return true; // Usuario sigue en la blacklist
        }

        return false; // Usuario no está en blacklist o fue removido
    } catch (err) {
        console.error('Error buscando en la blacklist:', err);
        return false; // En caso de error, asume que no está en blacklist
    }
}
        // Verificar si el usuario está en la blacklist
        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        console.log("¿Está en blacklist?", isBlacklisted); // Registro para ver si detecta correctamente
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }
        
        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.reply('No tienes permisos suficientes para usar este comando.');
        }

        try {
            // Obtener las entradas de blacklist
            const blacklistEntries = await Blacklist.find({ guildId: message.guild.id, removedAt: { $exists: false } });

            // Filtrar solo los miembros que están actualmente en el servidor
            const membersInServer = await Promise.all(blacklistEntries.map(async entry => {
                try {
                    return await message.guild.members.fetch(entry.userId);
                } catch (error) {
                    return null; // Miembro no encontrado en el servidor
                }
            })).then(results => results.filter(member => member !== null));

            if (membersInServer.length === 0) {
                return message.channel.send('Servidor asegurado, sin miembros en lista negra.');
            }

            const itemsPerPage = 5;
            const pages = Math.ceil(membersInServer.length / itemsPerPage);

            let currentPage = 0;

            const createEmbed = async (page) => {
                const start = page * itemsPerPage;
                const end = Math.min(start + itemsPerPage, membersInServer.length);
                const entries = membersInServer.slice(start, end);

                const embedDescription = entries.map(member => {
                    const entry = blacklistEntries.find(entry => entry.userId === member.id);
                    return `**Usuario:** ${member.user.tag}\n**ID:** ${member.id}\n**Razón:** ${entry.reason}\n**Prueba:** ${entry.proof}\n**Fecha de Blacklist:** ${new Date(entry.addedAt).toLocaleDateString()}\n**Añadido por:** <@${entry.staffId}>`;
                });

                const embed = new Discord.MessageEmbed()
                    .setTitle('Usuarios en Blacklist')
                    .setColor('#FF0000')
                    .setDescription(embedDescription.join('\n\n'))
                    .setFooter(`Página ${page + 1} de ${pages}`)
                    .setTimestamp();

                return embed;
            };

            const row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setCustomId('prev_page')
                        .setLabel('« Anterior')
                        .setStyle('PRIMARY')
                        .setDisabled(currentPage === 0),
                    new Discord.MessageButton()
                        .setCustomId('next_page')
                        .setLabel('Siguiente »')
                        .setStyle('PRIMARY')
                        .setDisabled(currentPage >= pages - 1)
                );

            const actionRow = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageSelectMenu()
                        .setCustomId('actions')
                        .setPlaceholder('Selecciona una acción')
                        .addOptions([
                            {
                                label: 'Banear',
                                value: 'ban',
                                description: 'Banear a los usuarios seleccionados'
                            },
                            {
                                label: 'Kickear',
                                value: 'kick',
                                description: 'Kickear a los usuarios seleccionados'
                            },
                            {
                                label: 'Ignorar',
                                value: 'ignore',
                                description: 'Ignorar los usuarios seleccionados'
                            }
                        ])
                );

            const embedMessage = await message.channel.send({
                embeds: [await createEmbed(currentPage)],
                components: [row, actionRow]
            });

            const filter = (i) => i.user.id === message.author.id;
            const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'prev_page') {
                    if (currentPage > 0) {
                        currentPage--;
                        await interaction.update({ embeds: [await createEmbed(currentPage)], components: [row.setComponents(
                            new Discord.MessageButton()
                                .setCustomId('prev_page')
                                .setLabel('« Anterior')
                                .setStyle('PRIMARY')
                                .setDisabled(currentPage === 0),
                            new Discord.MessageButton()
                                .setCustomId('next_page')
                                .setLabel('Siguiente »')
                                .setStyle('PRIMARY')
                                .setDisabled(currentPage >= pages - 1)
                        ), actionRow] });
                    }
                } else if (interaction.customId === 'next_page') {
                    if (currentPage < pages - 1) {
                        currentPage++;
                        await interaction.update({ embeds: [await createEmbed(currentPage)], components: [row.setComponents(
                            new Discord.MessageButton()
                                .setCustomId('prev_page')
                                .setLabel('« Anterior')
                                .setStyle('PRIMARY')
                                .setDisabled(currentPage === 0),
                            new Discord.MessageButton()
                                .setCustomId('next_page')
                                .setLabel('Siguiente »')
                                .setStyle('PRIMARY')
                                .setDisabled(currentPage >= pages - 1)
                        ), actionRow] });
                    }
                } else if (interaction.customId === 'actions') {
                    const selectedAction = interaction.values[0];

                    for (const member of membersInServer) {
                        const entry = blacklistEntries.find(e => e.userId === member.id);

                        if (member && entry) {
                            if (selectedAction === 'ban') {
                                try {
                                    await member.ban({ reason: entry.reason }); // Usar la razón de la blacklist
                                    await interaction.channel.send(`El usuario ${member.user.tag} ha sido baneado por: ${entry.reason}`);
                                } catch (error) {
                                    console.error(`Error al banear a ${member.user.tag}:`, error);
                                }
                            } else if (selectedAction === 'kick') {
                                try {
                                    await member.kick(entry.reason); // Usar la razón de la blacklist
                                    await interaction.channel.send(`El usuario ${member.user.tag} ha sido kickeado por: ${entry.reason}`);
                                } catch (error) {
                                    console.error(`Error al kickear a ${member.user.tag}:`, error);
                                }
                            }
                        }
                    }

                    await interaction.update({ content: `Acción realizada: ${selectedAction}`, components: [] });
                }
            });

            collector.on('end', collected => {
                embedMessage.edit({ components: [] });
            });
        } catch (error) {
            console.error('Error al obtener la blacklist:', error);
            message.channel.send('Hubo un error al intentar obtener la blacklist.');
        }
    }
};
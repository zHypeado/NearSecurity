const Discord = require('discord.js-light');
const { dataRequired, updateDataBase } = require("../../functions");
const db = require('megadb');
const dataRow = new db.crearDB('dataRows', 'data_bot');

module.exports = {
    nombre: 'whitelist',
    category: 'Configuración',
    premium: false,
    alias: [],
    description: 'Gestiona la lista blanca de NearSecurity usando botones interactivos. Se permiten IDs de miembros y URLs.',
    usage: ['n!whitelist'],
    run: async (client, message, args, _guild) => {
        
        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });
                if (user && user.removedAt == null) {
                    return true;
                }
                return false;
            } catch (err) {
                return false;
            }
        }
        
        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }

        if (message.author.id !== message.guild.ownerId) {
            return message.reply('Solo el dueño del servidor puede usar este comando.');
        }

        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.reply({ content: 'Necesitas permisos de __Administrador__.', ephemeral: false });

        let whitelist = _guild.configuration.whitelist;
        let whitelistText = whitelist.length > 0 
            ? whitelist.map(id => {
                if (id.startsWith('http')) {
                    return `URL: ${id}`;
                } else {
                    let entry = message.guild.roles.cache.get(id) || client.users.cache.get(id);
                    return entry ? `<@${entry.name || id}> (${id})` : `ID desconocido (${id})`;
                }
            }).join('\n')
            : 'No hay entradas en la lista blanca.';

        const embed = new Discord.MessageEmbed()
            .setTitle('Lista Blanca del servidor')
            .setDescription(`**Lista blanca actual:**\n${whitelistText}\n\nUsa los botones de abajo para gestionar la lista blanca.`)
            .setColor('#FFFFFF')
            .setFooter({ text: 'NearSecurity' });

        const buttons = new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton()
                .setCustomId('add_whitelist')
                .setLabel('Añadir a la whitelist')
                .setStyle('SUCCESS'),
            new Discord.MessageButton()
                .setCustomId('remove_whitelist')
                .setLabel('Remover de la whitelist')
                .setStyle('DANGER'),
            new Discord.MessageButton()
                .setCustomId('clear_whitelist')
                .setLabel('Limpiar whitelist')
                .setStyle('SECONDARY')
        );

        let initialMessage = await message.reply({
            embeds: [embed],
            components: [buttons],
            ephemeral: false
        });

        const filter = i => i.user.id === message.author.id;
        const collector = initialMessage.createMessageComponentCollector({ filter, time: 1000000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'add_whitelist') {
                await interaction.deferUpdate();
                let addMessage = await interaction.followUp({ content: 'Menciona un rol, escribe un ID de miembro o una URL para añadir a la whitelist.', ephemeral: false });

                const filter = m => m.author.id === message.author.id;
                const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });

                if (!collected.size) return addMessage.edit({ content: 'No se recibió ninguna entrada.', ephemeral: false });

                let mention = collected.first().mentions.roles.first() || collected.first().content.trim();

                if (!isNaN(mention)) {
                    let user;
                    try {
                        user = await client.users.fetch(mention);
                    } catch (err) {
                        return addMessage.edit({ content: 'ID de miembro inválido o no encontrado.', ephemeral: false });
                    }
                    if (_guild.configuration.whitelist.includes(user.id))
                        return addMessage.edit({ content: 'Ese miembro ya está en la lista blanca.', ephemeral: false });

                    _guild.configuration.whitelist.push(user.id);
                    updateDataBase(client, message.guild, _guild, true);
                    return addMessage.edit({ content: `Miembro con ID ${user.id} añadido a la lista blanca.`, ephemeral: false });
                }

                if (mention.startsWith('http')) {
                    if (_guild.configuration.whitelist.includes(mention))
                        return addMessage.edit({ content: 'Esa URL ya está en la lista blanca.', ephemeral: false });

                    _guild.configuration.whitelist.push(mention);
                    updateDataBase(client, message.guild, _guild, true);
                    return addMessage.edit({ content: `URL ${mention} añadida a la lista blanca.`, ephemeral: false });
                }

                if (mention && mention.name) {
                    if (_guild.configuration.whitelist.includes(mention.id))
                        return addMessage.edit({ content: 'Ese rol ya está en la lista blanca.', ephemeral: false });

                    _guild.configuration.whitelist.push(mention.id);
                    updateDataBase(client, message.guild, _guild, true);
                    return addMessage.edit({ content: `Rol ${mention.name} añadido a la lista blanca.`, ephemeral: false });
                } else {
                    return addMessage.edit({ content: 'Entrada inválida. Debes mencionar un rol, proporcionar un ID de miembro o una URL.', ephemeral: false });
                }

            } else if (interaction.customId === 'remove_whitelist') {
                await interaction.deferUpdate();

                if (whitelist.length === 0)
                    return interaction.followUp({ content: 'No hay entradas en la lista blanca para eliminar.', ephemeral: false });

                let removeOptions = whitelist.map(id => {
                    let description = id.startsWith('http') ? `URL: ${id}` : (message.guild.roles.cache.get(id) || client.users.cache.get(id)) ? `ID: ${id}` : `ID desconocido (${id})`;
                    return {
                        label: description,
                        description: 'Selecciona para remover.',
                        value: `remove_${id}`
                    };
                });

                const removeMenu = new Discord.MessageActionRow().addComponents(
                    new Discord.MessageSelectMenu()
                        .setCustomId('remove_whitelist_select')
                        .setPlaceholder('Selecciona un elemento para remover')
                        .addOptions(removeOptions)
                );

                let removeMessage = await interaction.followUp({
                    content: 'Selecciona un elemento de la lista blanca para remover.',
                    components: [removeMenu],
                    ephemeral: false
                });

                const removeCollector = removeMessage.createMessageComponentCollector({ time: 30000 });
                
                removeCollector.on('collect', async selectInteraction => {
                    let idToRemove = selectInteraction.values[0].split('_')[1];
                    _guild.configuration.whitelist = _guild.configuration.whitelist.filter(id => id !== idToRemove);
                    updateDataBase(client, message.guild, _guild, true);
                    await selectInteraction.update({ content: `Eliminado de la lista blanca.`, components: [], ephemeral: false });
                });

            } else if (interaction.customId === 'clear_whitelist') {
                await interaction.deferUpdate();
                _guild.configuration.whitelist = [];
                updateDataBase(client, message.guild, _guild, true);
                interaction.followUp({ content: 'Lista blanca limpiada.', ephemeral: false });
            }
        });
    },
};

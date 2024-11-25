const Discord = require('discord.js-light');

module.exports = {
    name: 'md',
    category: 'Admin',
    premium: false,
    alias: ['send', 'dm'],
    description: 'Prepara un mensaje directo con un embed editable y permite confirmar o cancelar el envío.',
    usage: ['<prefix>md <userId>'],
    run: async (client, message, args, _guild) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Verificar si el usuario tiene el rol requerido en el servidor especificado
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('No tienes el rol necesario para usar este comando.');
        }

        // Verificar si se proporciona un ID de usuario
        if (args.length < 1) {
            return message.channel.send('Por favor, proporciona el ID del usuario al que deseas enviar un mensaje.');
        }

        const userId = args[0];
        const user = await client.users.fetch(userId).catch(() => null);

        if (!user) {
            return message.channel.send('No se pudo encontrar el usuario con el ID proporcionado.');
        }

        // Crear un embed inicial
        let embed = new Discord.MessageEmbed()
            .setTitle('Mensaje Directo')
            .setDescription('Este es un mensaje directo modificado por un menú interactivo.')
            .setColor('#3498db')
            .setFooter('Mensaje enviado por NearSecurity');

        // Crear el menú desplegable para modificar el embed
        const selectMenu = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('modifyEmbed')
                    .setPlaceholder('Selecciona una opción para modificar el embed')
                    .addOptions([
                        {
                            label: 'Cambiar título',
                            value: 'change_title',
                            description: 'Cambia el título del embed',
                        },
                        {
                            label: 'Cambiar descripción',
                            value: 'change_description',
                            description: 'Cambia la descripción del embed',
                        },
                        {
                            label: 'Cambiar color',
                            value: 'change_color',
                            description: 'Cambia el color del embed',
                        }
                    ])
            );

        const actionRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('confirm')
                    .setLabel('Confirmar')
                    .setStyle('SUCCESS'),
                new Discord.MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancelar')
                    .setStyle('DANGER')
            );

        // Enviar el mensaje con el menú desplegable y los botones
        const msg = await message.channel.send({
            content: 'Modifica el embed con el menú y previsualízalo antes de confirmar o cancelar el envío.',
            embeds: [embed], // Mostrar el embed actual como previsualización
            components: [selectMenu, actionRow]
        });

        // Manejar la interacción del menú desplegable
        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'modifyEmbed') {
                if (i.values[0] === 'change_title') {
                    await i.reply({ content: 'Por favor, envía el nuevo título.', ephemeral: true });
                    const titleCollector = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 60000 });
                    titleCollector.on('collect', async m => {
                        embed.setTitle(m.content);
                        await msg.edit({ embeds: [embed] }); // Actualizar previsualización
                        await i.followUp({ content: 'Título actualizado.', ephemeral: true });
                        titleCollector.stop();
                    });
                } else if (i.values[0] === 'change_description') {
                    await i.reply({ content: 'Por favor, envía la nueva descripción.', ephemeral: true });
                    const descCollector = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 60000 });
                    descCollector.on('collect', async m => {
                        embed.setDescription(m.content);
                        await msg.edit({ embeds: [embed] }); // Actualizar previsualización
                        await i.followUp({ content: 'Descripción actualizada.', ephemeral: true });
                        descCollector.stop();
                    });
                } else if (i.values[0] === 'change_color') {
                    await i.reply({ content: 'Por favor, envía el nuevo color en formato hexadecimal (ej: #FF0000).', ephemeral: true });
                    const colorCollector = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 60000 });
                    colorCollector.on('collect', async m => {
                        const color = m.content.startsWith('#') ? m.content : `#${m.content}`;
                        embed.setColor(color);
                        await msg.edit({ embeds: [embed] }); // Actualizar previsualización
                        await i.followUp({ content: 'Color actualizado.', ephemeral: true });
                        colorCollector.stop();
                    });
                }
            } else if (i.customId === 'confirm') {
                try {
                    await user.send({ embeds: [embed] });
                    await i.reply({ content: 'Mensaje enviado exitosamente.', ephemeral: true });
                    msg.delete(); // Eliminar el mensaje de configuración
                } catch (error) {
                    await i.reply({ content: 'Hubo un error al enviar el mensaje directo.', ephemeral: true });
                }
            } else if (i.customId === 'cancel') {
                await i.reply({ content: 'Envio cancelado.', ephemeral: true });
                msg.delete(); // Eliminar el mensaje de configuración
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.edit({ components: [] }); // Eliminar los componentes después de que expire el tiempo
            }
        });
    }
};
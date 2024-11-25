const Discord = require('discord.js-light');
const Sanction = require('../../schemas/sanctionSchema');
const { dataRequired } = require('../../functions');

module.exports = {
    nombre: 'mod',
    category: 'Moderación',
    premium: false,
    alias: ['moduser'],
    description: 'Administra a un usuario mediante timeout, expulsión o ban.',
    usage: ['<prefix>mod <userMention> [reason]'],
    run: async (client, message, args, _guild) => {
        
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
        
        let LANG = {
            commands: {
                mod: {
                    moduser: {
                        message1: 'Por favor menciona un usuario o proporciona un ID válido.',
                        invalidUser: '<:Crossmark:1278179784433864795> | No puedes moderarte a ti mismo o al bot.',
                        message2: 'No puedes moderar a este usuario debido a la jerarquía de roles.',
                        defaultReason: 'Sin razón.',
                        timeoutFail: '<:Alert:1278748088789504082> | No puedo poner a este usuario en timeout.',
                        kickFail: '<:Alert:1278748088789504082> | No puedo expulsar a este usuario.',
                        banFail: '<:Alert:1278748088789504082> | No puedo banear a este usuario.',
                        confirm: 'Por favor confirma que deseas **{action}** a **<@{userId}>** (ID: {userId}) con la razón: **{reason}**',
                        actionSuccess: '<:Checkmark:1278179814339252299> | Acción realizada con éxito: **{action}**',
                    }
                }
            }
        };

        // Comprobación de permisos del bot
        if (!message.guild.me.permissions.has(['MODERATE_MEMBERS', 'KICK_MEMBERS', 'BAN_MEMBERS'])) {
            return message.channel.send({ content: LANG.data.missingBotPerms });
        }

        // Obtener el usuario mencionado o por ID
        let userMention = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

        // Verificar si se ha encontrado un miembro válido
        if (!userMention) {
            return message.reply(await dataRequired(LANG.commands.mod.moduser.message1 + '\n\n' + _guild.configuration.prefix + 'mod <userMention> [reason]'));
        }

        // No permitir moderar al bot ni al autor del mensaje
        if (userMention.id === client.user.id || userMention.id === message.author.id) {
            return message.reply(LANG.commands.mod.moduser.invalidUser);
        }

        // Verificar jerarquía de roles
        if (message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0) {
            return message.reply(LANG.commands.mod.moduser.message2);
        }

        // Establecer la razón de la sanción
        let reason = args.slice(1).join(' ') || LANG.commands.mod.moduser.defaultReason;

        // Crear el embed inicial de selección de sanción
        let sanctionEmbed = new Discord.MessageEmbed()
            .setTitle(`Moderación`)
            .setDescription(`Selecciona una acción para <@${userMention.id}>.\nRazón: ${reason}`)
            .setColor('#FFFFFF'); // Color blanco

        // Crear botones de acciones (timeout, kick, ban)
        const actionRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('timeout')
                    .setLabel('Timeout')
                    .setStyle('SECONDARY'),
                new Discord.MessageButton()
                    .setCustomId('kick')
                    .setLabel('Expulsar')
                    .setStyle('PRIMARY'),
                new Discord.MessageButton()
                    .setCustomId('ban')
                    .setLabel('Banear')
                    .setStyle('DANGER')
            );

        // Botones de confirmar y cancelar
        const confirmRow = new Discord.MessageActionRow()
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

        // Enviar el mensaje con los botones de acciones
        const msg = await message.channel.send({ embeds: [sanctionEmbed], components: [actionRow] });

        // Crear el collector de botones
        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'cancel') {
                await i.update({ content: 'Acción cancelada.', embeds: [], components: [] });
                return;
            }

            let sanctionType = '';

            if (i.customId === 'timeout') {
                if (!userMention.moderatable) {
                    return i.reply({ content: LANG.commands.mod.moduser.timeoutFail, ephemeral: true });
                }
                sanctionType = 'timeout';
            } else if (i.customId === 'kick') {
                if (!userMention.kickable) {
                    return i.reply({ content: LANG.commands.mod.moduser.kickFail, ephemeral: true });
                }
                sanctionType = 'kick';
            } else if (i.customId === 'ban') {
                if (!userMention.bannable) {
                    return i.reply({ content: LANG.commands.mod.moduser.banFail, ephemeral: true });
                }
                sanctionType = 'ban';
            }

            // Confirmación de acción
            let confirmationEmbed = new Discord.MessageEmbed()
                .setTitle(`Confirmación de Acción`)
                .setDescription(LANG.commands.mod.moduser.confirm
                    .replace('{action}', sanctionType)
                    .replace(/{userId}/g, userMention.id)
                    .replace('{reason}', reason))
                .setColor('#FFFFFF'); // Color blanco

            await i.update({ embeds: [confirmationEmbed], components: [confirmRow] });

            // Esperar respuesta de confirmación
            const confirmFilter = response => response.user.id === message.author.id;
            const confirmCollector = msg.createMessageComponentCollector({ filter: confirmFilter, time: 60000 });

            confirmCollector.on('collect', async response => {
                if (response.customId === 'confirm') {
                    // Realizar la sanción
                    let actionDescription;
                    if (sanctionType === 'timeout') {
                        await userMention.timeout(600000, reason); // Timeout por 10 minutos
                        actionDescription = `Se ha puesto en timeout a <@${userMention.id}> por **${reason}**.`;
                    } else if (sanctionType === 'kick') {
                        await userMention.kick(reason);
                        actionDescription = `Se ha expulsado a <@${userMention.id}> por **${reason}**.`;
                    } else if (sanctionType === 'ban') {
                        await userMention.ban({ reason });
                        actionDescription = `Se ha baneado a <@${userMention.id}> por **${reason}**.`;
                    }

                    // Guardar la sanción en la base de datos
                    const newSanction = new Sanction({
                        userId: userMention.id,
                        guildId: message.guild.id,
                        moderatorId: message.author.id, // Guardar el ID del moderador
                        sanctionType: sanctionType,
                        reason: reason
                    });
                    await newSanction.save();

                    // Embed de éxito de la acción
                    let actionEmbed = new Discord.MessageEmbed()
                        .setTitle(`<:Checkmark:1278179814339252299> Acción Realizada`)
                        .setDescription(`${actionDescription}\nMiembro responsable: <@${message.author.id}>`)
                        .setColor('#32CD32'); // Color verde
                    
                    // Enviar el nuevo embed de acción realizada
                    await message.channel.send({ embeds: [actionEmbed] });
                    
                    // Eliminar el mensaje de confirmación
                    await response.message.delete(); 
                    
                    confirmCollector.stop(); // Detener el collector
                } else if (response.customId === 'cancel') {
                    await response.update({ content: 'Acción cancelada.', embeds: [], components: [] });
                }
            });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }); // Desactivar los botones al finalizar
        });
    },
};
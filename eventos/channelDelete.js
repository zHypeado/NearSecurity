//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const { AuditLogEvent, MessageEmbed } = require('discord.js-light');
const { fecthDataBase, updateDataBase } = require('../functions');

// IDs de usuarios a ignorar (whitelist)
const creatorIdToIgnore = [
    '1277124708369961021', '508391840525975553', '1052415589995516014',
    '824119071556763668', '905883534521139210', '808346067317162015',
    '710034409214181396', '883857478540984360', '155149108183695360',
    '557628352828014614', '416358583220043796', '678344927997853742',
    '576395920787111936', '282859044593598464', '817892729173311549',
    '762217899355013120', '703886990948565003', '159985870458322944',
    '458276816071950337', '543567770579894272', '536991182035746816'
];

module.exports = async (client, channel) => {
    try {
        // Obtener datos del servidor desde la base de datos
        let _guild = await fecthDataBase(client, channel.guild, false);
        if (!_guild || !_guild.protection.antichannels.enable) return; // Verificar si antichannels está activado

        // Verificar logs de auditoría para identificar al creador
        const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete });
        const logEntry = auditLogs.entries.first();
        if (!logEntry) return;

        const executor = logEntry.executor;

        // No tomar acción si el usuario está en la whitelist
        if (creatorIdToIgnore.includes(executor.id) || _guild.configuration.whitelist.includes(executor.id)) {
            console.log(`El usuario ${executor.tag} está en la whitelist y no será baneado.`);
            return;
        }

        // Crear de nuevo el canal eliminado si ya no existe
        const existingChannel = channel.guild.channels.cache.get(channel.id);
        if (!existingChannel) {
            await channel.guild.channels.create(channel.name, {
                type: channel.type,
                reason: 'Restauración de canal eliminado.'
            }).catch(err => console.error('Error creando el canal:', err));
        }

        // Manejar el conteo de canales eliminados por el usuario
        if (!client.super.cache.eliminatedChannels) {
            client.super.cache.eliminatedChannels = {};
        }
        if (!client.super.cache.eliminatedChannels[executor.id]) {
            client.super.cache.eliminatedChannels[executor.id] = [];
        }

        // Guardar el ID del canal eliminado
        client.super.cache.eliminatedChannels[executor.id].push(channel.id);

        // Si el usuario ha eliminado 3 canales, proceder a banear
        if (client.super.cache.eliminatedChannels[executor.id].length >= 3) {
            const botMember = channel.guild.members.me;
            if (botMember && botMember.permissions.has('BanMembers')) {
                await channel.guild.members.ban(executor, { reason: 'Eliminación de 3 canales.' })
                    .catch(err => console.error('Error al intentar banear al usuario:', err));
                console.log(`El usuario ${executor.tag} ha sido baneado por eliminar 3 canales.`);

                // Eliminar los registros después del baneo
                delete client.super.cache.eliminatedChannels[executor.id];
            }
        }

        // Registrar en logs si están configurados
        if (_guild.configuration.logs[0]) {
            const logChannel = client.channels.cache.get(_guild.configuration.logs[0]);
            if (logChannel) {
                await logChannel.send({
                    content: `\`LOG:\` Se ha intentado eliminar un canal y ha sido restaurado.`,
                    embeds: [
                        new MessageEmbed()
                            .setColor("#FDFDFD")
                            .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL() })
                            .addFields({ name: 'Canal restaurado:', value: `\`${channel.name} (${channel.id})\`` })
                    ]
                }).catch(err => console.error('Error enviando mensaje de log:', err));
            }
        }

        // Verificación de eliminación masiva para banear por raids
        const cache = await client.super.cache.get(channel.guild.id, true) || { amount: 0 };
        cache.amount++;

        if (cache.amount >= 3) {
            const botMember = channel.guild.members.me;
            if (botMember && botMember.permissions.has('BanMembers')) {
                // No banear si el creador está en la whitelist
                if (executor && !creatorIdToIgnore.includes(executor.id) && !_guild.configuration.whitelist.includes(executor.id)) {
                    await channel.guild.members.ban(executor, { reason: 'Eliminación masiva de canales (Raid).' })
                        .catch(err => console.error('Error al intentar banear al raider:', err));
                }
            }

            client.super.cache.delete(channel.guild.id); // Limpiar cache para evitar múltiples baneos
        } else {
            client.super.cache.up(channel.guild.id, cache);
            setTimeout(() => {
                client.super.cache.delete(channel.guild.id);
            }, 10000);
        }

        // Actualizar el estado de antichannels en la base de datos
        await updateDataBase(client, channel.guild, _guild, true);

    } catch (err) {
        console.error('Error en el evento channelDelete:', err);
    }
};

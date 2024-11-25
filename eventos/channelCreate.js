//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const { MessageEmbed } = require('discord.js-light');
const { fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, channel) => {
    try {
        // Obtener datos del servidor desde la base de datos
        let _guild = await fecthDataBase(client, channel.guild, false);
        if (!_guild) return;

        // Verificar si el sistema antichannels está activado
        if (!_guild.protection.antichannels.enable) return;

        // Mensaje de log
        const logMessage = "El sistema antichannels está activado. Se ha eliminado un canal creado sin permiso.";

        // Lista de IDs de usuarios que deben ser ignorados (bots verificados)
        const creatorIdsToIgnore = [
            '1277124708369961021', '508391840525975553', '1052415589995516014',
            '824119071556763668', '905883534521139210', '808346067317162015',
            '710034409214181396', '883857478540984360', '155149108183695360',
            '557628352828014614', '416358583220043796', '678344927997853742',
            '576395920787111936', '282859044593598464', '817892729173311549',
            '762217899355013120', '703886990948565003', '159985870458322944',
            '458276816071950337', '543567770579894272', '536991182035746816'
        ];

        // Obtener logs de auditoría para creación de canales
        let logEntry;
        try {
            const auditLogs = await channel.guild.fetchAuditLogs({ type: 10 }); // Tipo 10 es ChannelCreate
            logEntry = auditLogs.entries.first();
        } catch (err) {
            console.error('Error obteniendo logs de auditoría:', err);
            return;
        }

        if (!logEntry) {
            console.log("No se pudo encontrar la entrada de auditoría para la creación del canal.");
            return;
        }

        const executor = logEntry.executor;

        // Verificar si el canal fue creado por un usuario de la lista de ignorados
        if (creatorIdsToIgnore.includes(executor.id)) {
            console.log(`El canal ${channel.name} fue creado por el usuario con ID ${executor.id}, no se eliminará.`);
            return;
        }

        // Verificar si el creador está en la whitelist del servidor
        if (_guild.configuration.whitelist.includes(executor.id)) {
            console.log(`El usuario ${executor.tag} está en la whitelist, no se tomarán acciones.`);
            return;
        }

        const botMember = channel.guild.members.me; // Instancia del bot

        // Verificar si el bot tiene permisos para banear
        if (botMember && botMember.permissions.has('BanMembers')) {
            try {
                await channel.guild.members.ban(executor, { reason: 'Creación no autorizada de canales.' });
                console.log(`Usuario ${executor.tag} baneado por creación no autorizada de canales.`);
            } catch (err) {
                console.error('Error al intentar banear al creador del canal:', err);
            }
        } else {
            console.warn('El bot no tiene permisos suficientes para banear.');
        }

        // Eliminar el canal creado
        try {
            await channel.delete("Canal creado por un usuario no autorizado.");
            console.log(`Canal ${channel.name} eliminado.`);
        } catch (err) {
            console.error('Error al intentar eliminar el canal:', err);
        }

        // Eliminar otros canales con el mismo nombre
        await deleteSimilarChannels(channel, creatorIdsToIgnore, botMember);

        // Registrar en logs si están configurados
        await logChannelDeletion(client, _guild, executor, channel);

        // Verificación de creación rápida de canales (posible raid)
        await handlePossibleRaid(client, channel, creatorIdsToIgnore);

        // Actualizar la base de datos
        await updateDataBase(client, channel.guild, _guild, true);

    } catch (err) {
        console.error('Error en el evento channelCreate:', err);
    }
};

// Función para eliminar canales similares
async function deleteSimilarChannels(channel, creatorIdsToIgnore, botMember) {
    try {
        const similarChannels = channel.guild.channels.cache.filter(ch => ch.name === channel.name);

        for (const similarChannel of similarChannels.values()) {
            const auditLogsForChannel = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 });
            const similarLogEntry = auditLogsForChannel.entries.first();

            if (!similarLogEntry) {
                console.log(`No se encontró entrada de auditoría para el canal ${similarChannel.name}.`);
                continue;
            }

            const similarExecutor = similarLogEntry.executor;

            // Si el canal fue creado por un usuario en creatorIdsToIgnore, no lo eliminamos
            if (creatorIdsToIgnore.includes(similarExecutor.id)) {
                console.log(`El canal ${similarChannel.name} fue creado por el usuario con ID ${similarExecutor.id}, no se eliminará.`);
                continue;
            }

            // Eliminar el canal duplicado
            await similarChannel.delete("Eliminado por tener el mismo nombre que un canal creado no autorizado.")
                .then(() => console.log(`Canal duplicado ${similarChannel.name} eliminado.`))
                .catch(err => console.error(`Error eliminando el canal duplicado ${similarChannel.name}:`, err));
        }
    } catch (err) {
        console.error('Error buscando o eliminando canales duplicados:', err);
    }
}

// Función para registrar la eliminación del canal
async function logChannelDeletion(client, _guild, executor, channel) {
    if (_guild.configuration.logs[0]) {
        try {
            const logChannel = client.channels.cache.get(_guild.configuration.logs[0]);
            if (logChannel) {
                const embed = new MessageEmbed()
                    .setColor("#FDFDFD")
                    .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL() })
                    .addFields(
                        { name: 'Canal eliminado:', value: `\`${channel.name} (${channel.id})\``, inline: true },
                        { name: 'Creador del canal:', value: `${executor.tag} (${executor.id})`, inline: true }
                    );

                await logChannel.send({ content: `\`LOG:\` ${logMessage}`, embeds: [embed] });
            }
        } catch (err) {
            console.error('Error enviando mensaje de log:', err);
            _guild.configuration.logs = [];
            await updateDataBase(client, channel.guild, _guild, true);
        }
    }
}

// Función para manejar posibles raids
async function handlePossibleRaid(client, channel, creatorIdsToIgnore) {
    const cache = await client.super.cache.get(channel.guild.id, true) || { amount: 0 };
    cache.amount++;

    if (cache.amount >= 5) {
        try {
            const recentAuditLogs = await channel.guild.fetchAuditLogs({ type: 10 });
            const recentLogEntry = recentAuditLogs.entries.first();
            const recentExecutor = recentLogEntry.executor;

            if (!creatorIdsToIgnore.includes(recentExecutor.id)) {
                const botMember = channel.guild.members.me; // Instancia del bot
                if (botMember && botMember.permissions.has('BanMembers')) {
                    await channel.guild.members.ban(recentExecutor, { reason: 'Creación masiva de canales (Raid).' });
                    console.log(`Usuario ${recentExecutor.tag} baneado por posible raid.`);
                }
            }

            // Eliminar canales creados en los últimos minutos
            const recentChannels = channel.guild.channels.cache.filter(ch => ch.type === channel.type && ch.createdTimestamp > Date.now() - 60000);
            for (const ch of recentChannels.values()) {
                await ch.delete().catch(err => console.error('Error eliminando canal por raid:', err));
            }
        } catch (err) {
            console.error('Error procesando raid:', err);
        }

        client.super.cache.delete(channel.guild.id);
    } else {
        client.super.cache.up(channel.guild.id, cache);
        setTimeout(() => client.super.cache.delete(channel.guild.id), 10000);
    }
}

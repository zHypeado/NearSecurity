//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Discord = require('discord.js-light');
const { intelligentSOS, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, webhook) => {
    const guild = webhook.guild;
    let _guild = await fecthDataBase(client, guild, false);
    if (!_guild) return;

    const creatorIdToIgnore = [
        '1277124708369961021', '508391840525975553', '1052415589995516014',
        '824119071556763668', '905883534521139210', '808346067317162015',
        '710034409214181396', '883857478540984360', '155149108183695360',
        '557628352828014614', '416358583220043796', '678344927997853742',
        '576395920787111936', '282859044593598464', '817892729173311549',
        '762217899355013120', '703886990948565003', '159985870458322944',
        '458276816071950337', '543567770579894272', '536991182035746816'
    ];

    try {
        // Obtener los registros de auditoría para la creación de webhooks
        const auditLogs = await guild.fetchAuditLogs({ type: Discord.AuditLogEvent.WebhookCreate });
        const entry = auditLogs.entries.first();
        if (!entry) {
            console.log("No se encontraron registros de auditoría.");
            return;
        }

        const prsn = entry.executor;

        // Excluir IDs de usuarios que deben ser ignorados
        if (creatorIdToIgnore.includes(prsn.id)) {
            console.log(`Webhook creado por ${prsn.tag} (ID ${prsn.id}) está en la lista de IDs ignorados. No se tomará ninguna acción.`);
            return;
        }

        // Registrar logs si están habilitados
        if (_guild.configuration.logs[0]) {
            try {
                const logChannel = client.channels.cache.get(_guild.configuration.logs[0]);
                if (logChannel) {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#FDFDFD")
                        .setAuthor(prsn.tag, prsn.displayAvatarURL())
                        .addField(`Webhook Creado:`, `Webhook creado por ${prsn.tag}`, true);

                    await logChannel.send({ content: `LOG: Webhook creado.`, embeds: [embed] });
                }
            } catch (err) {
                console.error('Error enviando logs de webhook creado:', err);
                _guild.configuration.logs = [];
                await updateDataBase(client, guild, _guild, true);
            }
        }

        // Verificar si el creador está en la whitelist
        if (_guild.configuration.whitelist.includes(prsn.id)) {
            console.log(`El usuario ${prsn.tag} está en la whitelist. No se tomará ninguna acción.`);
            return;
        }

        // Protección anti-webhook activada
        if (_guild.protection.antiwebhook && _guild.protection.antiwebhook.enable) {
            const maxWebhooks = _guild.protection.antiwebhook.maxWebhooks || 3; // Número máximo de webhooks permitidos (por defecto 3)

            // Control de límite de webhooks creados por usuario
            if (!_guild.protection.webhookCache) {
                _guild.protection.webhookCache = {};
            }

            if (!_guild.protection.webhookCache[prsn.id]) {
                _guild.protection.webhookCache[prsn.id] = { count: 1 };
            } else {
                _guild.protection.webhookCache[prsn.id].count++;
            }

            // Si supera el límite, banear al usuario y eliminar webhooks creados por él
            if (_guild.protection.webhookCache[prsn.id].count >= maxWebhooks) {
                try {
                    // Banear al creador si no está en la lista ignorada
                    if (guild.me.permissions.has('BAN_MEMBERS')) {
                        await guild.members.ban(prsn, { reason: 'Detección de abuso de webhooks.' });
                        console.log(`Usuario ${prsn.tag} baneado por exceder el límite de webhooks.`);
                    }

                    // Eliminar los webhooks creados por el usuario baneado
                    const webhooks = await guild.fetchWebhooks();
                    const userWebhooks = webhooks.filter(wh => wh.owner && wh.owner.id === prsn.id);
                    for (const hook of userWebhooks.values()) {
                        await hook.delete('Webhook creado por usuario no autorizado.')
                            .then(() => console.log(`Webhook ${hook.name} eliminado.`))
                            .catch(err => console.error(`Error al eliminar webhook ${hook.name}:`, err));
                    }

                    delete _guild.protection.webhookCache[prsn.id];

                    // Si es un bot y está en modo antiraid
                    if (prsn.bot && _guild.protection.antiraid && _guild.protection.antiraid.saveBotsEntrities) {
                        const botEntry = _guild.protection.antiraid.saveBotsEntrities;
                        if (botEntry._bot === prsn.id) {
                            await guild.members.ban(botEntry.authorOfEntry).catch(() => {});
                            if (_guild.protection.intelligentSOS.enable) {
                                await intelligentSOS(_guild, client, 'Creación excesiva de webhooks.');
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error baneando al usuario o eliminando sus webhooks:', err);
                }
            } else {
                // Actualizar la base de datos con el nuevo conteo
                await updateDataBase(client, guild, _guild, true);
                // Limpiar el caché después de un tiempo
                setTimeout(() => {
                    delete _guild.protection.webhookCache[prsn.id];
                }, 10000);
            }
        }

        // Modo raid activado
        if (_guild.protection.raidmode && _guild.protection.raidmode.enable) {
            try {
                await guild.members.ban(prsn, { reason: 'Raidmode activado.' });
                console.log(`Usuario ${prsn.tag} baneado debido al modo raid activado.`);
            } catch (err) {
                console.error('Error baneando al usuario en modo raid:', err);
            }
        }

    } catch (err) {
        console.error('Error al obtener los registros de auditoría:', err);
    }
};

//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Discord = require('discord.js-light');
const { intelligentSOS, fecthDataBase, updateDataBase } = require('../functions');

// IDs de usuarios a ignorar (ejemplo de whitelist)
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
    let _guild = await fecthDataBase(client, channel.guild, false);
    if (!_guild) return;

    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    try {
        const auditLogs = await channel.guild.fetchAuditLogs({ type: 'UPDATE_CHANNEL' });
        const prsn = auditLogs.entries.first().executor;

        // Verificar si el ejecutor está en la whitelist
        if (_guild.configuration.whitelist.includes(prsn.id) || creatorIdToIgnore.includes(prsn.id)) return;

        // Verificar permisos del bot
        if (!channel.guild.me.permissions.has('BAN_MEMBERS')) {
            console.warn('El bot no tiene permisos para banear miembros.');
            return;
        }

        // Protección contra raid
        if (_guild.protection.antiraid.enable) {
            let cache = await client.super.cache.get(channel.guild.id, true) || { amount: 0 };
            cache.amount++;

            if (cache.amount >= 3) {
                await channel.guild.members.ban(prsn, { reason: 'Raid.' }).catch(err => {
                    console.error('Error al intentar banear al miembro durante la protección contra raid:', err);
                });

                // Manejo de bots
                if (prsn.bot && _guild.protection.antiraid.saveBotsEntrities) {
                    if (_guild.protection.antiraid.saveBotsEntrities._bot === prsn.id) {
                        try {
                            await channel.guild.members.ban(_guild.protection.antiraid.saveBotsEntrities.authorOfEntry);
                        } catch (err) {
                            console.error('Error al intentar banear al autor de la entrada del bot:', err);
                        }

                        if (_guild.protection.intelligentSOS.enable) {
                            await intelligentSOS(_guild, client, 'Canales creados');
                        }
                    }
                }
            } else {
                client.super.cache.up(channel.guild.id, cache);
                setTimeout(() => {
                    client.super.cache.delete(channel.guild.id);
                }, 10000);
            }
        }

        // Modo raid
        if (_guild.protection.raidmode.enable) {
            await channel.guild.members.ban(prsn, { reason: 'Raidmode.' }).catch(err => {
                console.error('Error al intentar banear al miembro en modo raid:', err);
            });
        }

    } catch (err) {
        if (err instanceof Discord.DiscordAPIError && err.code === 50013) {
            console.info(`[INFO] Missing permissions to get ChannelUpdate in (${channel.guild.id})`);
        } else {
            console.error('Error procesando actualización de canal:', err);
        }
    }
};

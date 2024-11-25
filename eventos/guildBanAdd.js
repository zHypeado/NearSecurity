//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { intelligentSOS, updateDataBase, fecthDataBase } = require('../functions');

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

module.exports = async (client, member) => {
    let _guild = await fecthDataBase(client, member.guild, false);
    if (!_guild) return;

    let LANG = require(`../LANG/${_guild.configuration.language}.json`);

    try {
        const auditLogs = await member.guild.fetchAuditLogs({ type: 'BAN' });
        const prsn = auditLogs.entries.first();

        // Verificar si el ejecutor está en la whitelist
        if (_guild.configuration.whitelist.includes(prsn.executor.id) || creatorIdToIgnore.includes(prsn.executor.id)) return;

        // Registrar logs
        if (_guild.configuration.logs[0]) {
            const logChannel = client.channels.cache.get(_guild.configuration.logs[0]);
            if (logChannel) {
                const embed = new Discord.MessageEmbed()
                    .setColor("#FFFFFF")
                    .setAuthor(member.guild.name, member.guild.iconURL())
                    .addField(`${LANG.events.guildBanAdd.log_author}:`, `\`${prsn.executor.username} (${prsn.executor.id})\``, true)
                    .addField(`${LANG.events.guildBanAdd.log_bannedPerson}:`, `\`${prsn.target.username} (${prsn.target.id})\``, true);

                await logChannel.send({ content: `\`LOG:\` ${LANG.events.guildBanAdd.log_banAdd}.`, embeds: [embed] });
            }
        }
    } catch (err) {
        const errorChannel = client.channels.cache.get(_guild.configuration.logs[1]);
        if (errorChannel) {
            await errorChannel.send({ content: `Logs error (guildBanAdd): \`${err}\`` }).catch(() => {});
        }

        _guild.configuration.logs = [];
        await updateDataBase(client, member.guild, _guild, true);
    }

    // Protección contra raid
    if (member.guild.me.permissions.has('BAN_MEMBERS')) {
        if (_guild.protection.antiraid.enable) {
            let cache = await client.super.cache.get(member.guild.id, true) || { amount: 0 };
            cache.amount++;

            if (cache.amount >= 5) {
                await member.guild.members.ban(prsn.executor, { reason: 'Raid.' }).catch(err => {
                    console.error('Error al intentar banear al miembro durante la protección contra raid:', err);
                });

                // Manejo de bots
                if (prsn.executor.bot && _guild.protection.antiraid.saveBotsEntrities) {
                    if (_guild.protection.antiraid.saveBotsEntrities._bot === prsn.executor.id) {
                        await member.guild.members.ban(_guild.protection.antiraid.saveBotsEntrities.authorOfEntry).catch(err => {
                            console.error('Error al intentar banear al autor de la entrada del bot:', err);
                        });

                        if (_guild.protection.intelligentSOS.enable) {
                            await intelligentSOS(_guild, client, 'Baneos masivos');
                        }
                    }
                }
            } else {
                client.super.cache.up(member.guild.id, cache);
                setTimeout(() => {
                    client.super.cache.delete(member.guild.id);
                }, 10000);
            }
        }

        // Modo raid
        if (_guild.protection.raidmode.enable) {
            await member.guild.members.ban(prsn.executor, { reason: 'Raidmode.' }).catch(err => {
                console.error('Error al intentar banear al miembro en modo raid:', err);
            });
        }
    }
};

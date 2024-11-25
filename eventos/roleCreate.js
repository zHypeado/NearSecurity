//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { intelligentSOS, fecthDataBase, updateDataBase } = require('../functions');

const creatorIdToIgnore = [
    '1277124708369961021', '508391840525975553', '1052415589995516014',
    '824119071556763668', '905883534521139210', '808346067317162015',
    '710034409214181396', '883857478540984360', '155149108183695360',
    '557628352828014614', '416358583220043796', '678344927997853742',
    '576395920787111936', '282859044593598464', '817892729173311549',
    '762217899355013120', '703886990948565003', '159985870458322944',
    '458276816071950337', '543567770579894272', '536991182035746816'
];

module.exports = async (client, role) => {
    try {
        let _guild = await fecthDataBase(client, role.guild, false);
        if (!_guild) return;

        let LANG = require(`../LANG/${_guild.configuration.language}.json`);

        role.guild.fetchAuditLogs({ type: 'CREATE_ROLE' }).then(async logs => {
            let prsn = logs.entries.first().executor;

            // Verificar si el ejecutor está en la whitelist
            if (_guild.configuration.whitelist.includes(prsn.id) || creatorIdToIgnore.includes(prsn.id)) return;

            // Logs:
            try {
                if (_guild.configuration.logs[0]) {
                    client.channels.cache.get(_guild.configuration.logs[0]).send({
                        content: `\`LOG:\` ${LANG.events.roleCreate.logMessage1}.`,
                        embeds: [
                            new Discord.MessageEmbed()
                                .setColor("#FDFDFD")
                                .setAuthor(prsn.tag, prsn.displayAvatarURL())
                                .addField(`${LANG.events.roleCreate.logMessage1}:`, `\`${role.name} (${role.id})\``, true)
                        ]
                    }).catch(err => {});
                }
            } catch (err) {
                client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (roleCreate): \`${err}\`` }).catch(() => {});
                _guild.configuration.logs = [];
                updateDataBase(client, role.guild, _guild, true);
            }

            // Antiraid:
            if (role.guild.me.permissions.has('BAN_MEMBERS')) {
                if (_guild.protection.antiraid.enable) {
                    let cache = await client.super.cache.get(role.guild.id, true);

                    if (cache.amount >= 3) {
                        await role.guild.members.ban(prsn, { reason: 'Raid.' }).catch(e => {});
                        if (prsn.bot) {
                            if (_guild.protection.antiraid.saveBotsEntrities) {
                                if (_guild.protection.antiraid.saveBotsEntrities._bot === prsn.id) {
                                    role.guild.members.ban(_guild.protection.antiraid.saveBotsEntrities.authorOfEntry).catch();
                                    if (_guild.protection.intelligentSOS.enable) {
                                        await intelligentSOS(_guild, client, 'Roles creados');
                                    }
                                }
                            }
                        }
                    } else {
                        client.super.cache.up(role.guild.id, cache);
                        setTimeout(() => {
                            client.super.cache.delete(role.guild.id);
                        }, 10000);
                    }
                }
            }

            // Raidmode:
            if (_guild.protection.raidmode.enable) {
                if (role.guild.me.permissions.has('BAN_MEMBERS')) {
                    await role.guild.members.ban(prsn, { reason: 'Raidmode.' }).catch(e => {});
                }
            }

        }).catch(err => {});
    } catch (err) {}
};

//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { fecthDataBase, updateDataBase } = require('../functions');

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

    member.guild.fetchAuditLogs({ type: 'UNBAN' }).then(async logs => {
        let prsn = logs.entries.first();

        // Verificar si el ejecutor está en la whitelist
        if (_guild.configuration.whitelist.includes(prsn.executor.id) || creatorIdToIgnore.includes(prsn.executor.id)) return;

        // Logs:
        try {
            if (_guild.configuration.logs[0]) {
                client.channels.cache.get(_guild.configuration.logs[0]).send({
                    content: `\`LOG:\` ${LANG.events.guildBanRemove.log_banRemoved}.`,
                    embeds: [
                        new Discord.MessageEmbed()
                            .setColor("#FDFDFD")
                            .setAuthor(member.guild.name, member.guild.iconURL())
                            .addField(`${LANG.events.guildBanRemove.log_author}:`, `\`${prsn.executor.username} (${prsn.executor.id})\``, true)
                            .addField(`${LANG.events.guildBanRemove.log_unbannedPerson}:`, `\`${prsn.target.username} (${prsn.target.id})\``, true)
                    ]
                }).catch(err => {});
            }
        } catch (err) {
            client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Logs error (guildBanRemove): \`${err}\`` }).catch(() => {});
            _guild.configuration.logs = [];
            updateDataBase(client, member.guild, _guild, true);
        }
    }).catch(err => {});
};

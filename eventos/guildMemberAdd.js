//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Guild = require('../schemas/guildsSchema');
const Timers = require('../schemas/timersSchema');
const Discord = require('discord.js-light');
const ms = require('ms');
const { pulk, fecthDataBase, updateDataBase } = require('../functions');
const Blacklist = require('../schemas/blacklist'); // Ruta del modelo de blacklist

module.exports = async (client, member) => {
    client.users.fetch(member.guild.ownerId);

    let _guild = await fecthDataBase(client, member.guild, false);
    if (!_guild) return;

    // Función para enviar mensaje unificado al owner
    async function sendOwnerMessage(title, description, fields) {
        const embed = new Discord.MessageEmbed()
            .setColor("#FDFDFD")
            .setTitle(title)
            .setDescription(description)
            .addFields(fields)
            .setFooter(member.guild.name, member.guild.iconURL());

        client.users.fetch(member.guild.ownerId).then(owner => {
            owner.send({
                content: `\`LOG:\` ${title} en **${member.guild.name}**`,
                embeds: [embed]
            }).catch(err => {
                console.error('Error enviando mensaje al fundador:', err);
            });
        });
    }

    // Logs:
    try {
        if (_guild.configuration.logs && _guild.configuration.logs[0]) {
            client.channels.cache.get(_guild.configuration.logs[0]).send({
                content: '`LOG:` Nuevo miembro.',
                embeds: [new Discord.MessageEmbed().setColor("#FDFDFD").setAuthor(member.guild.name, member.guild.iconURL()).addField(`Persona:`, `\`${member.user.username} (${member.user.id})\``, true)]
            }).catch(err => {});
        }
    } catch (err) {
        if (_guild.configuration.logs && _guild.configuration.logs[1]) {
            client.channels.cache.get(_guild.configuration.logs[1]).send({ content: `Error en logs (guildMemberAdd): \`${err}\`` }).catch(() => {});
        }
        _guild.configuration.logs = [];
    }

    // Comprobar si el usuario está en blacklist:
    try {
        const blacklistEntry = await Blacklist.findOne({ userId: member.user.id, removedAt: { $exists: false } });
        if (blacklistEntry) {
            const reason = blacklistEntry.reason ? blacklistEntry.reason.toString() : 'No se proporcionó una razón';

            if (member.guild.me.permissions.has('BAN_MEMBERS')) {
                const embed = new Discord.MessageEmbed()
                    .setTitle('<:Alert:1278748088789504082> Has sido baneado')
                    .setDescription(`**${member.user.tag}**, has sido baneado de **${member.guild.name}**.`)
                    .addField('Razón', reason, false)
                    .setColor("#FF0000")
                    .setFooter(member.guild.name, member.guild.iconURL());

                const guildButton = new Discord.MessageActionRow()
                    .addComponents(
                        new Discord.MessageButton()
                            .setCustomId('server_name')
                            .setLabel(member.guild.name)
                            .setStyle('SECONDARY')
                            .setDisabled(true)
                    );

                // Enviar mensaje al usuario
                await member.send({ embeds: [embed], components: [guildButton] }).catch(() => {});

                // Enviar al dueño del servidor usando la nueva función unificada
                sendOwnerMessage(
                    'Usuario en blacklist intentó ingresar',
                    `El usuario \`${member.user.tag}\` intentó ingresar y está en la blacklist.`,
                    [
                        { name: 'Razón', value: reason, inline: false }
                    ]
                );

                // Banear al miembro con la razón correcta
                member.guild.members.ban(member, { reason: `Baneado por blacklist: ${reason}` }).catch(err => {
                    console.error('Error al intentar banear al usuario:', err);
                });
            }
            return;
        }
    } catch (err) {
        console.error('Error comprobando blacklist:', err);
    }

    try {
        let cache = await client.super.cache.get(member.guild.id, true);

        // Antijoins:
        if (_guild.protection && _guild.protection.antijoins && _guild.protection.antijoins.enable) {
            if (cache.remember && cache.remember.length > 0 && cache.remember.includes(member.user.id)) {
                if (member.guild.me.permissions.has('BAN_MEMBERS')) {
                    const embed = new Discord.MessageEmbed()
                        .setDescription(`<:Alert:1278748088789504082> <@${member.user.id}> ha sido baneado de ingresar a **${member.guild.name}**.`)
                        .setFooter(member.guild.name, member.guild.iconURL())
                        .setColor("#FF0000");

                    const guildButton = new Discord.MessageActionRow()
                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId('server_name')
                                .setLabel(member.guild.name)
                                .setStyle('SECONDARY')
                                .setDisabled(true)
                        );

                    await member.send({ embeds: [embed], components: [guildButton] }).then(() => {
                        member.guild.members.ban(member, { reason: `Antijoins activado.` }).catch(err => {});
                    }).catch(() => {
                        member.guild.members.ban(member, { reason: `Antijoins activado.` }).catch(err => {});
                    });

                    // Enviar mensaje unificado al owner
                    sendOwnerMessage(
                        'Usuario baneado por antijoins',
                        `El usuario \`${member.user.tag}\` ha sido baneado por antijoins.`,
                        [
                            { name: 'Usuario', value: `<@${member.user.id}>`, inline: false }
                        ]
                    );
                    return;
                }
            }
        }

        // **NUEVO CÓDIGO**: Basado en audit logs para bots añadidos
        if (member.user.bot) {
            // Obtener los logs de auditoría para saber quién invitó al bot
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: 'BOT_ADD'
            });
            const botAddLog = fetchedLogs.entries.first();

            // Verifica que el log exista y que sea reciente
            const inviter = botAddLog && botAddLog.target.id === member.user.id ? botAddLog.executor : null;

            // Embed informando que un bot ha sido añadido
            const embedBotAdded = new Discord.MessageEmbed()
                .setColor("#FDFDFD")
                .addField('Lo invitó:', inviter ? `<@${inviter.id}>` : 'Desconocido') // Muestra correctamente quién invitó al bot
                .addField('Bot:', member.user.tag)
                .addField('¿Verificado?:', member.user.flags.has(1 << 16) ? 'Sí' : 'No') // Cambiado para comprobar correctamente la verificación del bot
                .addField('¿Antibot activo?:', _guild.protection && _guild.protection.antibots && _guild.protection.antibots.enable ? 'Sí' : 'No');

            // Enviar mensaje unificado al dueño del servidor
            sendOwnerMessage(
                'Nuevo bot añadido',
                `Se ha añadido un nuevo bot a **${member.guild.name}**`,
                [
                    { name: 'Bot', value: member.user.tag, inline: true },
                    { name: 'Invitado por', value: inviter ? `<@${inviter.id}>` : 'Desconocido', inline: true },
                    { name: '¿Verificado?', value: member.user.flags.has(1 << 16) ? 'Sí' : 'No', inline: true }
                ]
            );

            // Antibots
            if (_guild.protection && _guild.protection.antibots && _guild.protection.antibots.enable) {
                if (_guild.protection.antibots._type === 'all') {
                    if (member.guild.me.permissions.has('KICK_MEMBERS')) {
                        await member.guild.members.kick(member.user.id, `Antibots activado.`).catch(err => {});
                        sendOwnerMessage(
                            'Bot removido por antibots',
                            `El bot \`${member.user.tag}\` ha sido removido de **${member.guild.name}**`,
                            []
                        );
                    }
                } else if (_guild.protection.antibots._type === 'only_nv' && !member.user.flags.has(65536)) {
                    if (member.guild.me.permissions.has('KICK_MEMBERS')) {
                        await member.guild.members.kick(member.user.id, `Antibots activado.`).catch(err => {});
                        sendOwnerMessage(
                            'Bot removido por antibots (no verificado)',
                            `El bot \`${member.user.tag}\` ha sido removido de **${member.guild.name}**`,
                            []
                        );
                    }
                } else if (_guild.protection.antibots._type === 'only_v' && member.user.flags.has(65536)) {
                    if (member.guild.me.permissions.has('KICK_MEMBERS')) {
                        await member.guild.members.kick(member.user.id, `Antibots activado.`).catch(err => {});
                        sendOwnerMessage(
                            'Bot removido por antibots (verificado)',
                            `El bot \`${member.user.tag}\` ha sido removido de **${member.guild.name}**`,
                            []
                        );
                    }
                }
            }
        } else {
            // Antitokens:
            if (_guild.protection && _guild.protection.antitokens && _guild.protection.antitokens.enable) {
                if (cache.amount > 3) {
                    if (member.guild.me.permissions.has('KICK_MEMBERS') && user.isToken === false) {
                        member.guild.members.kick(member, `Antitokens activado.`).catch(err => {});
                    }
                }
                for (let x of `${member.user.username}`.split(' ')) {
                    if (cache.remember && cache.remember.length > 0 && cache.remember.includes(x) && x !== '') {
                        if (member.guild.me.permissions.has('BAN_MEMBERS') && user.isToken === false) {
                            client.users.cache.get(member.user.id).send(`Has sido baneado por tokens.`).then(() => {
                                member.guild.members.ban(member, { reason: `Antitokens activado.` }).catch(err => {});
                            }).catch(err => {});
                        }
                    } else {
                        client.super.cache.push({ id: member.guild.id }, x);
                    }
                }
                if (_guild.protection.antitokens._type === 'all') {
                    if (user.isToken) {
                        if (member.guild.me.permissions.has('KICK_MEMBERS')) {
                            member.guild.members.kick(member, `Antitokens activado.`).catch(err => {});
                        }
                    }
                } else if (_guild.protection.antitokens._type === 'only_nv' && !user.isToken) {
                    if (member.guild.me.permissions.has('KICK_MEMBERS')) {
                        member.guild.members.kick(member, `Antitokens activado.`).catch(err => {});
                    }
                } else if (_guild.protection.antitokens._type === 'only_v' && user.isToken) {
                    if (member.guild.me.permissions.has('KICK_MEMBERS')) {
                        member.guild.members.kick(member, `Antitokens activado.`).catch(err => {});
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error en el sistema de protección:', err);
    }
};

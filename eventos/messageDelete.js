//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Discord = require('discord.js-light');
const { pulk, fecthDataBase, updateDataBase } = require('../functions');

module.exports = async (client, message) => {
    if (!message.guild || !message.guild.available) return;
    if (message.channel.type === 'dm') return;
    if (message.webhookID || !message.author || !message.author.id) return;
    if (message.partial) await message.fetch();

    let _guild = await fecthDataBase(client, message.guild, false);
    if (!_guild) return;

    // IDs de creadores a ignorar
    const creatorIdToIgnore = [
    '1277124708369961021', '508391840525975553', '1052415589995516014',
    '824119071556763668', '905883534521139210', '808346067317162015',
    '710034409214181396', '883857478540984360', '155149108183695360',
    '557628352828014614', '416358583220043796', '678344927997853742',
    '576395920787111936', '282859044593598464', '817892729173311549',
    '762217899355013120', '703886990948565003', '159985870458322944',
    '458276816071950337', '543567770579894272', '536991182035746816'
];

    // Establece el cache si no existe
    if (!await client.super.cache.has(message.guild.id)) client.super.cache.setGuildBase(message.guild.id);
    let cache = client.super.cache.get(message.guild.id, true);

    try {
        // Verificar si la protección anti-raids está habilitada
        if (_guild.protection && _guild.protection.antiRaid && _guild.protection.antiRaid.enable) {
            // Inicializa el contador de mensajes borrados en el cache
            if (!cache.messageDeleteCount) {
                cache.messageDeleteCount = {};
            }

            const userId = message.author.id;
            const currentTime = Date.now();

            // Si el usuario ya está en el cache, incrementar su contador
            if (!cache.messageDeleteCount[userId]) {
                cache.messageDeleteCount[userId] = {
                    count: 1,
                    firstDeleteTime: currentTime
                };
            } else {
                const userData = cache.messageDeleteCount[userId];

                // Si el tiempo de la primera eliminación fue en menos de 1 segundo, incrementa el contador
                if (currentTime - userData.firstDeleteTime <= 1000) {
                    userData.count++;
                } else {
                    // Reinicia el contador y establece el nuevo tiempo
                    userData.count = 1;
                    userData.firstDeleteTime = currentTime;
                }
            }

            // Si el usuario borró más de 15 mensajes en menos de 1 segundo, proceder a banear
            if (cache.messageDeleteCount[userId].count > 15 && !creatorsToIgnore.includes(userId)) {
                if (message.guild.me.permissions.has('BAN_MEMBERS')) {
                    await message.guild.members.ban(message.author, { reason: 'Probable raid (borrado masivo de mensajes).' });
                    console.log(`Usuario ${message.author.tag} baneado por probable raid.`);

                    // Enviar log de baneo
                    const logChannel = _guild.configuration.logs[0];
                    if (logChannel) {
                        const logChannelObj = client.channels.cache.get(logChannel);
                        if (logChannelObj) {
                            await logChannelObj.send(`**LOG:** Usuario baneado por probable raid: ${message.author.tag}`);
                        }
                    }
                }
                // Reiniciar el contador después del baneo
                delete cache.messageDeleteCount[userId];
            }
        }

        // Verifica si hay un canal de logs configurado
        const logChannel = _guild.configuration.logs[0];
        if (logChannel) {
            const logChannelObj = client.channels.cache.get(logChannel);
            if (!logChannelObj) return; // Si el canal no existe, salir

            // Ghostping detection (si está habilitado)
            if (!_guild.moderation || !_guild.moderation.dataModeration || !_guild.moderation.dataModeration.events) return;
            const ghostpingEnabled = _guild.moderation.dataModeration.events.ghostping;
            if (ghostpingEnabled && message.mentions.members.first() && !message.member.permissions.has('MANAGE_MESSAGES')) {
                // Enviar log de ghostping
                await logChannelObj.send({
                    content: '`LOG:` Ghostping detectado (Mensaje borrado).',
                    embeds: [
                        new Discord.MessageEmbed()
                            .setColor("#FDFDFD")
                            .setAuthor(`${message.author.username}`, message.author.displayAvatarURL({ }))
                            .setDescription(message.content ?? '> `Sin contenido en el mensaje.`')
                            .setImage(message.attachments.size > 0 ? message.attachments.first().proxyURL : null)
                    ]
                });

                // Activar automoderador si está habilitado
                if (_guild.moderation.automoderator.enable && _guild.moderation.automoderator.events.ghostping) {
                    await automoderator(client, _guild, message, 'Menciones fantasmas.');
                }
            } else {
                // Enviar log normal de eliminación de mensaje
                await logChannelObj.send({
                    content: '`LOG:` Mensaje eliminado.',
                    embeds: [
                        new Discord.MessageEmbed()
                            .setColor("#FDFDFD")
                            .setAuthor(message.author.tag, message.author.displayAvatarURL())
                            .setDescription(message.content ?? '> `Sin contenido en el mensaje.`')
                            .addField('Canal:', `<#${message.channel.id}>`, true)
                            .addField('Bot:', `\`${message.author.bot}\``, true)
                    ]
                });
            }
        }

        // Actualizar la base de datos y la cache
        await updateDataBase(client, message.guild, _guild, true);
        client.super.cache.post(message.guild.id, cache);

    } catch (err) {
        console.error('Error al enviar el log de eliminación de mensaje:', err);
    }
};

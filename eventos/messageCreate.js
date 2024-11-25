const Discord = require('discord.js-light');
const { version } = require('../package.json');
const Guild = require('../schemas/guildsSchema');
const Support = require('../schemas/supportSchema');
const db = require('megadb');
const dev = new db.crearDB('devsActivos', 'data_users');
const { automoderator, intelligentSOS, fecthDataBase, updateDataBase, fecthUsersDataBase, updateUsersDataBase, getResponseAndDelete } = require('../functions');
const mayus = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ms = require('ms');
const antiIpLogger = require("anti-ip-logger");

module.exports = async (client, message) => {
    
    if(message.channel.type === 'DM') {
        let _support = await Support.findOne({ fetchAutor: message.author.id });
        if(_support) {
            if(message.author.id == _support.author.id) {
                if(message.content.startsWith('n!close')) {
                    message.channel.send({ content: 'Has cerrado el chat.' });
                    message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${_support.staff.tag}\` **se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    await client.users.fetch(_support.staff.id);
                    await client.users.cache.get(_support.staff.id).send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${_support.author.tag}\` **ha cerrado el chat, se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    let dataStaffArray = await dev.get('array');
                    if(!dataStaffArray.includes(_support.staff.id)) {
                        dev.push('array', _support.staff.id);
                    }
                    await Support.findOneAndDelete({ fetchAutor: message.author.id });
                    return;
                }
                message.channel.send({ content: 'Enviando mensaje...' }).then(async x => {
                    await client.users.fetch(_support.staff.id);
                    await client.users.cache.get(_support.staff.id).send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content) ] }).catch(async err => {
                        message.channel.send({ content: 'Error al enviar mensaje, he cerrado la conversación.' });
                        await Support.findOneAndDelete({ fetchAutor: message.author.id });
                    });
                    x.edit({ content: 'Mensaje enviado con éxito.' });
                });
            }
        }
        let __support = await Support.findOne({ fetchStaff: message.author.id });
        if(__support) {
            if(message.author.id == __support.staff.id) {
                if(message.content.startsWith('n!close')) {
                    message.channel.send({ content: 'Has cerrado el chat.' });
                    message.author.send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${__support.author.tag}\` **se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    await client.users.fetch(__support.author.id);
                    await client.users.cache.get(__support.author.id).send({ embeds: [ new Discord.MessageEmbed().setColor('RED').setDescription(`[←] \`${__support.staff.tag}\` **ha cerrado el chat, se ha desconectado de la conversación**.`) ] }).catch(err => {});
                    let dataStaffArray = await dev.get('array');
                    if(!dataStaffArray.includes(__support.staff.id)) {
                        dev.push('array', __support.staff.id);
                    }
                    await Support.findOneAndDelete({ fetchAutor: __support.author.id });
                    return;
                }
                message.channel.send({ content: 'Enviando mensaje...' }).then(async x => {
                    if(message.author.id == __support.staff.id) {
                        await client.users.fetch(__support.author.id);
                        await client.users.cache.get(__support.author.id).send({ embeds: [ new Discord.MessageEmbed().setColor('GREEN').setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription(message.content) ] }).catch(async err => {
                            message.channel.send({ content: 'Error al enviar mensaje, he cerrado la conversación.' });
                            await Support.findOneAndDelete({ fetchAutor: __support.author.id });
                        });
                        x.edit({ content: 'Mensaje enviado con éxito.' });
                    }
                });
            }
        }
        return;
    }
    
    if(!message.guild) return;
    if(!message.guild.available) return;
    if(!message.author || !message.author.id) return;
    if(message.partial) await message.fetch();

    let _guild = await fecthDataBase(client, message.guild, false); 
    if(!_guild) return message.reply('Hubo un error en la base de datos.');

    let cache = await client.super.cache.get(message.guild.id, true);

if (message.webhookId) {
    try {
        if (message.guild.members.me.permissions.has('MANAGE_WEBHOOKS')) {
            if (_guild.protection.purgeWebhooksAttacks.enable) {
                client.super.cache.up(message.guild.id, cache);

                if (cache.amount >= 4) {
                    message.channel.fetchWebhooks().then(async webhooks => {
                        webhooks.forEach(webhook => {
                            if (webhook.id === message.webhookId) {
                                if (_guild.configuration.whitelist.includes(webhook.owner.id)) return;

                                // Eliminar webhook
                                webhook.delete().then(async () => {
                                    message.channel.send(`He eliminado el webhook \`${webhook.name}\`, creado por \`${webhook.owner.username}#${webhook.owner.discriminator}\`. Envió muchos mensajes a la vez.`);

                                    // Sanciones si el creador del webhook es el mismo que anteriormente
                                    if (_guild.protection.purgeWebhooksAttacks.rememberOwners === webhook.owner.id) {
                                        if (message.guild.members.me.permissions.has('BAN_MEMBERS')) {
                                            message.guild.members.ban(webhook.owner, { reason: 'Raid con webhooks.' }).catch(err => {});
                                            message.channel.send({ content: 'También lo he baneado por crear 4 veces un webhook raider.' });

                                            // Lógica para SOS inteligente
                                            if (_guild.protection.intelligentSOS.enable) {
                                                await intelligentSOS(_guild, client, 'Flood de webhook');
                                            }
                                        }
                                    } else {
                                        _guild.protection.purgeWebhooksAttacks.rememberOwners = webhook.owner.id;
                                    }
                                }).catch(err => {
                                    console.error(`Error al eliminar webhook: ${err}`);
                                });
                            }
                        });
                    });
                }

                updateDataBase(client, message.guild, _guild);

                setTimeout(() => {
                    client.super.cache.down(message.guild.id, cache);
                }, 3000);
            }
        }
    } catch (err) {
        console.error(`Error en el manejo de webhooks: ${err}`);
    }

    return;
}


// Código para manejar mensajes de usuarios
if (!message.author.bot) {
    // Aquí iría el código para manejar ataques de raid por parte de usuarios
    if (_guild.protection.antiraid.enable === true && message.member.moderatable) {
        let newMessage = message.content.toLowerCase();

        // Palabras clave asociadas a raids
        const raidKeywords = ['raided', 'pwned', 'hacked', 'clowned', '@everyone', 'discord.gg'];
        let detectedWords = 0;

        // Contar cuántas palabras clave se detectan en el mensaje
        raidKeywords.forEach(keyword => {
            if (newMessage.includes(keyword)) {
                detectedWords++;
            }
        });

        // Si se detectan 2 o más palabras clave, se procede con la sanción
        if (detectedWords >= 2) {
            message.member.ban({ reason: 'Posible raider. (Mensajes de raid)' }).then(async () => {
                // Esperar 2 segundos antes de eliminar el mensaje
                setTimeout(() => {
                    message.delete();
                }, 2000);
                // Enviar mensaje de sanción
                message.channel.send(`Se ha detectado un raid, ha sido sancionado el usuario ${message.author.tag} (${message.author.id}).`);
            }).catch(err => {
                console.error(`Error al intentar banear al usuario: ${err}`);
            });
        }
    }
}

    if(message.author.bot) return;
    // Ping al bot:
	async function ping() {
		let img = message.mentions.users.first();
		if(!img) return;
        if(img.id == client.user.id) {
            if(_guild.configuration.subData.pingMessage == 'allDetails') {
                let totalSeconds = (client.uptime / 1000);
                let days = Math.floor(totalSeconds / 86400);
                totalSeconds %= 86400;
                let hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 3600;
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = Math.floor(totalSeconds % 60);
                message.channel.send({ embeds: [ new Discord.MessageEmbed().setColor("#FCFDFF").setDescription('`NearSecurity ' + version + '` es un bot basado en [SPAgency](https://github.com/devEthan6737/nearsecurity).\n\n<a:a_secure:953907590004355103> **Un bot __Antiraid__ eficiente para proteger a tu servidor, comunidad o empresa.**\n<:uo_next:955381240293392445> *Usá `n!ayuda` para comenzar*.\n\n<a:a_Filter:953182746182828042> Llevo encendido **' + days + ' días**, **' + hours + ' horas**, **' + minutes + ' minutos** y **' + seconds + ' segundos**, además de que me reinicio seguido para lanzar mis actualizaciones.\n\n<:emote:992383379024650341> Puedes invitarme dando [click aquí](https://discord.com/oauth2/authorize?client_id=1277124708369961021&permissions=8&integration_type=0&scope=bot+applications.commands), recomendamos entrar a nuestro soporte.').setFooter('NearSecurity').setImage("https://cdn.discordapp.com/attachments/1277170460924317777/1279309614520864820/nearsecurity.jpg") ], components: [
                    new Discord.MessageActionRow()
                    .addComponents(new Discord.MessageButton()
                        .setLabel('Soporte oficial')
                        .setEmoji('⚙').
                        setURL('https://discord.gg/a7FqNnHk2m')
                        .setStyle('LINK'))
                ] });
            }else if(_guild.configuration.subData.pingMessage == 'pingLessDetails') {
                message.reply({ embeds: [ new Discord.MessageEmbed().setColor("#FCFDFF").addField('Si necesitas mi ayuda, puedes usar comandos como:', '`'+ _guild.configuration.prefix + 'comandos`, `'+ _guild.configuration.prefix + 'invite`, `' + _guild.configuration.prefix + 'ayuda`').setFooter('NearSecurity') ] });
            }else if(_guild.configuration.subData.pingMessage == 'onlySupportServer') {
                message.reply({ content: '¡Aqui estoy para ayudarte!' });
            }
            return;
        }
    }
    ping();

    cache = await client.super.cache.get(message.author.id, true);

    try{
        if(!message.member.permissions.has('MANAGE_MESSAGES')) {

            // Badwords:
            for(x of _guild.moderation.dataModeration.badwords) {
                if(message.content.toLowerCase().includes(x)) {
                    message.reply({ content: `¡La palabra \`${x}\` está prohibida!` }).then(x => {
                        setTimeout(() => {
                            message.delete().catch(err => {});
                            x.delete();
                        }, 2000);
                    });

                    if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.badwordDetect == true) {
                        await automoderator(client, _guild, message, 'Malas palabras.');
                    }
                }
            }

            // BasicFlood:
            if(_guild.protection.antiflood == true) {
                if(cache.amount >= _guild.moderation.automoderator.actions.basicFlood) {
                    message.channel.send({ content: `¡Deja de hacer flood <@${message.author.id}>!` });
                    if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.floodDetect == true) {
                        await automoderator(client, _guild, message, 'Flood.');
                    }
                }else{
                    client.super.cache.up(message.author.id, cache);

                    setTimeout(() => {
                        client.super.cache.down(message.author.id, cache);
                    }, 3000);
                }
            }

            // ManyPings:
            if(_guild.moderation.dataModeration.events.manyPings == true) {
                if(message.content.split('@').length - 1 >= _guild.moderation.automoderator.actions.manyPings) {
                    message.reply({ content: '¡No hagas tantas menciones!' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.manyPings == true) {
                            await automoderator(client, _guild, message, 'Demasiadas menciones en un mismo mensaje.');
                        }
                    });
                }
            }

            // CapitalLetters:
            if(_guild.moderation.dataModeration.events.capitalLetters == true) {
                if(message.content.length >= 6) {
                    let contar = 0;
                    for(let i = 0; i < mayus.length; i++) {
                        for(let x = 0; x < message.content.length; x++) {
                            if(message.content[x] == mayus[i]) {
                                contar++;
                            }
                        }
                    }
                    if(contar >= message.content.length / 2) {
                        message.reply({ content: '¡No escribas tantas mayúsculas!' }).then(async x => {
                            setTimeout(() => {
                                x.delete();
                                message.delete().catch(err => {});
                            }, 2000);
                            if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.capitalLetters == true) {
                                await automoderator(client, _guild, message, 'Muchas mayúsculas en un mismo mensaje.');
                            }
                        });
                    }
                }
            }

            // ManyEmojis:
            if(_guild.moderation.dataModeration.events.manyEmojis == true) {
                if(!message.content.includes('@') && (message.content.split('<:').length - 1 >= _guild.moderation.automoderator.actions.manyEmojis || message.content.split(/\p{Emoji}/u).length - 1 >= _guild.moderation.automoderator.actions.manyEmojis) && message.content.split(/\p{Emoji}/u).length - 1 != 18) {
                    message.reply({ content: 'No puedes escribir tantos emojis.' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.manyEmojis == true) {
                            await automoderator(client, _guild, message, 'Demasiados emojis en un mismo mensaje.');
                        }
                    });
                }
            }

            // ManyWords:
            if(_guild.moderation.dataModeration.events.manyWords == true) {
                if(message.content.length >= _guild.moderation.automoderator.actions.manyWords) {
                    message.reply({ content: 'Escribe como máximo 250 caracteres.' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.manyWords == true) {
                            await automoderator(client, _guild, message, 'Mensajes muy largos.');
                        }
                    });
                }
            }
       
            // iploggerFilter
            if(_guild.moderation.dataModeration.events.iploggerFilter == true && message.content.includes('http')) {
                message.rememberContent = message.content;
                message.content = message.content.split(' ');
                message.content = message.content.filter(word => word.includes('http'));
                if(message.content[0]) message.content = message.content[0];
                else message.content = message.rememberContent;

                if(await antiIpLogger(`${message.content}`)) {
                    message.reply({ content: '¡Ese link contiene un iplogger!' }).then(async x => {
                        setTimeout(() => {
                            x.delete();
                            message.delete().catch(err => {});
                        }, 2000);
                        if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.iploggerFilter == true) {
                            await automoderator(client, _guild, message, 'Enviar iploggers.');
                        }
                    });
                }
            }
        }

        // IntelligentAntiflood:
        if(_guild.protection.intelligentAntiflood == true) {
            if(message.guild.members.me.permissions.has('KICK_MEMBERS')) {
                if(`${message.channel.name}`.includes('flood') || (`${message.channel.topic}`.includes('permite') && `${message.channel.topic}`.includes('flood') && !`${message.channel.topic}`.includes('no')))return;
                if(message.content == cache.lastContent) {
                    cache.lastContent = message.content;
                    client.super.cache.up(message.author.id, cache);
                    if(cache.amount >= 5) {
                        client.super.cache.delete(message.author.id);

                        message.guild.members.members.ban(message.author.id, { reason: 'Flood masivo.' }).then(async () => {
                            message.channel.send('He baneado al usuario.');
                            if(_guild.protection.intelligentSOS.enable == true) {
                                await intelligentSOS(_guild, client, 'Flood masivo');
                            }
                        }).catch(err => {});
                    }
                    message.delete().catch(err => {});

                    setTimeout(() => {
                        client.super.cache.delete(message.author.id);
                    }, 6100);
                }else{
                    cache.lastContent = message.content;
                    client.super.cache.post(message.author.id, cache);
                }
            }
        }

        // Infecteds users with antiraid system:
        if(_guild.protection.antiraid.enable == true && message.member.moderatable) {
            let newMessage = `${message.content}`.toLowerCase();
            if((newMessage.includes('free') || newMessage.includes('steam') || newMessage.includes('discord')) && newMessage.includes('nitro') && newMessage.includes('http')) {
                message.member.timeout(ms('7d'), 'Usuario infectado.').then(() => {
                    setTimeout(() => {
                        message.delete();
                    }, 2000);
                    message.reply({ content: 'Un usuario infectado ha aparecido regalando nitro falso en el servidor (`' + message.author.id + '`), lo he muteado una semana.' });
                }).catch(e => {});
            }
        }

        //antispam raid bot
        if (_guild.protection.antiraid.enable == true && message.member.moderatable) {
            let newMessage = `${message.content}`.toLowerCase();

            const raidKeywords = ['raided', 'pwned', 'hacked', 'clowned', '@everyone', 'discord.gg'];
            let detectedWords = 0;

            raidKeywords.forEach(keyword => {
                if (newMessage.includes(keyword)) {
                    detectedWords++;
                }
            });

            if (detectedWords >= 2) {
                message.member.ban({ reason: 'Posible raider. (Mensajes de raid)' }).then(() => {
                    setTimeout(() => {
                        message.delete();
                    }, 2000);
                    message.reply({ content: 'Un usuario envió posibles mensajes de raid (`' + message.author.id + '`), lo he baneado.' });
                }).catch(e => {});
            }
        }


        // Disable raidmode:
        if(_guild.protection.raidmode.enable == true && _guild.protection.raidmode.activedDate + ms(_guild.protection.raidmode.timeToDisable) <= Date.now()) {
            _guild.protection.raidmode.enable = false;
            updateDataBase(client, message.guild, _guild);
            message.reply({ content: '`Raidmode fue desactivado:` Ha expirado el tiempo establecido desde la activación.' });
        }

    }catch(err) {}

    if(!message.content.startsWith(_guild.configuration.prefix) || message.author.bot)return;

    if(process.env.TURN_ON_CANARY === 'true' && _guild.configuration.prefix != process.env.DEFAULT_CANARY_PREFIX) {
        if(process.env.TURN_ON_CANARY === 'true' && _guild.configuration.language != process.env.DEFAULT_LANGUAGE) _guild.configuration.language = process.env.DEFAULT_LANGUAGE;
        _guild.configuration.prefix = process.env.DEFAULT_CANARY_PREFIX;
        updateDataBase(client, message.guild, _guild, false);
    }

    if (!message.content.startsWith(_guild.configuration.prefix) || message.content.length == _guild.configuration.prefix.length) return;

    let args = message.content.slice(_guild.configuration.prefix.length).trim().split(/ +/);
    let command = args.shift().toLowerCase();
    let cmd = client.comandos.get(command) || client.comandos.find(x => x.alias && x.alias.includes(command));

    if(!cmd) return message.channel.send({ content: '<:Crossmark:1278179784433864795> | El comando no fue encontrado' });
    if(cmd.premium)message.reply({ content: '<:Crossmark:1278179784433864795> | `¡Ese comando es para usuarios premium!`' });

    if(_guild.configuration.password.enable && !_guild.configuration.password.usersWithAcces.includes(message.author.id)) {
        message.reply({ content: 'El sistema 2fa está activado. Después de este mensaje, escribe la contraseña para usar comandos.' });
        let collector = message.channel.createMessageCollector({ time: 30000 });
        collector.on('collect', m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {
                if(m.content == _guild.configuration.password._password) {
                    message.reply({ content: 'Contraseña correcta, has sido registrado con éxito. Vuelve a escribir el comando.' });
                    _guild.configuration.password.usersWithAcces.push(message.author.id);
                    m.delete();
                    updateDataBase(client, message.guild, _guild, true);
                    collector.stop();
                }else{
                    message.reply({ content: 'Contraseña incorrecta.' });
                    collector.stop();
                }
            }
        });
        return;
    }

//    if(await ratelimitFilter(message)) {
//        if(_guild.protection.intelligentSOS.cooldown) _guild.protection.intelligentSOS.cooldown = false;
//        if((message.guild.roles.highest.id != message.guild.members.me.roles.highest.id || !_guild.protection.antiraid.enable) && Math.floor(Math.random() * 100) >= 50) message.channel.send({ content: '**Recordatorio:**', embeds: [ new Discord.MessageEmbed().setColor("#FCFDFF").setDescription((message.guild.roles.highest.id != message.guild.members.me.roles.highest.id? '<:Alert:1278748088789504082> `> Alerta de seguridad:` El bot no tiene el rol más alto en el servidor.\n' : '') + (!_guild.protection.antiraid.enable? '<:Alert:1278748088789504082> `> Alerta de seguridad:` El sistema antiraid está desactivado en este servidor (Activar con `' + _guild.configuration.prefix + 'antiraid`).' : '')) ] });
//
        await cmd.run(client, message, args, _guild);
//    }
}
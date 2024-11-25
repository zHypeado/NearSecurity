//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Guild = require('../schemas/guildsSchema');
const Discord = require('discord.js-light');
const { pulk, ratelimitFilter, automoderator, fecthDataBase, updateDataBase } = require('../functions');
const antiIpLogger = require("anti-ip-logger");

module.exports = async (client, oldMessage, message) => {
    if(!message.guild)return;
    if(!message.guild.available)return;
    if(message.channel.type === 'DM') return;
    if(message.webhookID)return;
    if(!message.author || !message.author.id)return;
    if(message.partial) await message.fetch();
    if(message.author.bot) return;

    let _guild = await fecthDataBase(client, message.guild, false);
    if(!_guild)return;

    if(!await client.super.cache.has(message.guild.id)) client.super.cache.setGuildBase(message.guild.id);
    let cache = client.super.cache.get(message.guild.id, true);

    try{
        // Logs:
        if(_guild.configuration.logs[0]) {
            // Ghostping
            if(!message.member.permissions.has('MANAGE_MESSAGES') && _guild.moderation.dataModeration.events.ghostping && message.mentions.members.first()) {
                client.channels.cache.get(_guild.configuration.logs[0]).send({ content: '`LOG:` Ghostping detectado (Mensaje editado).', embeds: [
                    new Discord.MessageEmbed().setColor("#FDFDFD").setAuthor(`${message.author.username}`, `${message.author.displayAvatarURL({ })}`).setDescription(`${oldMessage.content ?? '> `Sin contenido en el mensaje.`'}`).setImage(oldMessage.attachments.size > 0? (oldMessage.attachments.first()).proxyURL : 'https://asd.com/')
                ] });

                if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.ghostping == true) {
                    await automoderator(client, _guild, oldMessage, 'Menciones fantasmas.');
                }
            }else client.channels.cache.get(_guild.configuration.logs[0]).send({ embeds: [ new Discord.MessageEmbed().setColor("#FDFDFD").setTitle("Mensaje editado.").setAuthor(message.author.tag, message.author.displayAvatarURL()).setDescription('`(Mostrando mensaje antes de editar)`\n ' + oldMessage.content + '\n\n`(Mostrando mensaje después de editar)` \n' + message.content).addField('En el canal:', `<#${message.channel.id}>`, true).addField('Bot:', `\`${message.author.bot}\``, true) ] }).catch(err => {
                client.channels.cache.get(_guild.configuration.logs[0]).send({ content: '`Error 004`: Message so long!' }).catch(error => {
                    _guild.configuration.logs = [];
                    updateDataBase(client, message.guild, _guild, true);
                    return;
                });
            });
        }
        
        if(_guild.configuration.ignoreChannels.includes(message.channel.id) && !message.content.startsWith(`${_guild.configuration.prefix}ignoreThisChannel`))return; // <- Ignoring channels...

        if(!message.member.permissions.has('MANAGE_MESSAGES')) {
            // Badwords:
            for(x of _guild.moderation.dataModeration.badwords) {
                if(message.content.toLowerCase().includes(x)) {
                    message.reply({ content: `¡La palabra \`${x}\` está prohibida!` }).then(x => {
                        setTimeout(() => {
                            message.delete();
                            x.delete();
                        }, 2000);
                    });
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
                if(message.content.split('<:').length - 1 >= _guild.moderation.automoderator.actions.manyEmojis) {
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

            // LinkDetect:
            if(_guild.moderation.dataModeration.events.linkDetect == true) {
                if(message.content.includes('http') || message.content.includes('.gg')) {
                    let detect = false;
                    _guild.moderation.automoderator.actions.linksToIgnore.forEach(x => {
                        if(message.content.includes(x)) detect = true;
                    });
                    if(detect == false) {
                        message.reply({ content: '¡No hagas spam!' }).then(async x => {
                            setTimeout(() => {
                                x.delete();
                                message.delete().catch(err => {});
                            }, 2000);
                            if(_guild.moderation.automoderator.enable == true && _guild.moderation.automoderator.events.linkDetect == true) {
                                await automoderator(client, _guild, message, 'Publicar enlaces.');
                            }
                        });
                    }
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

        updateDataBase(client, message.guild, _guild, true);

    }catch(err) {}

    if(!message.content.startsWith(_guild.configuration.prefix) || message.content.length === _guild.configuration.prefix.length)return;

    let args = message.content.slice(_guild.configuration.prefix.length).trim().split(/ +/);
    let command = args.shift().toLowerCase();
    let cmd = client.comandos.get(command) || client.comandos.find(x => x.alias.includes(command));

    if(!cmd)return;
    if(cmd.premium)message.reply({ content: '<:Crossmark:1278179784433864795> | `¡Ese comando es para usuarios premium!`' });

    if(await ratelimitFilter(message) == true) {
        _guild = await Guild.findOne({ id: message.guild.id });
        await cmd.run(client, message, args, _guild);
    }
}
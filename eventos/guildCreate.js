//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Discord = require('discord.js-light');
const Timers = require('../schemas/timersSchema');
const { setGuildBase } = require('../Utils/DataBase/base');
const Blacklist = require('../schemas/blacklist');
const { version } = require("../package-lock.json");

module.exports = async (client, guild) => {
    try {
        if (guild) {
            // Guardar base del servidor
            await setGuildBase(guild);

            // Log channel para enviar información del nuevo servidor
            const logChannel = client.channels.cache.get("YOUR-STAFF-LOGS-CHANNEL");

            // Obtener el fundador del servidor
            let founder = await client.users.fetch(guild.ownerId);
            if (!founder) {
                console.error(`No se pudo obtener el fundador con ID ${guild.ownerId}`);
                return;
            }

            // Verificar la cantidad de miembros en el servidor
            if (guild.memberCount < 1) {
                await founder.send({
                    embeds: [new Discord.MessageEmbed()
                        .setTitle('¡Atención! El servidor debe tener al menos 15 miembros.')
                        .setDescription(
                            `El servidor **${guild.name}** tiene solo **${guild.memberCount} miembros**.\n` +
                            `Para añadir el bot, debe haber al menos 15 miembros en el servidor.`
                        )
                        .setColor("#FF0000")
                        .setTimestamp()
                    ]
                }).catch(err => console.error('Error enviando el mensaje a fundador por pocos miembros:', err));

                await guild.leave().catch(err => console.error('Error dejando el servidor:', err));
                return; // Salir de la función
            }

            // Obtener todos los bots presentes en el servidor
            const botMembers = guild.members.cache.filter(member => member.user.bot);

            // Filtrar bots verificados y no verificados
            const verifiedBots = botMembers.filter(bot => bot.user.flags?.has('VERIFIED_BOT'));
            const nonVerifiedBots = botMembers.filter(bot => !bot.user.flags?.has('VERIFIED_BOT'));

            // Obtener los nombres de los primeros 10 bots verificados y no verificados
            const verifiedBotNames = verifiedBots.map(bot => bot.user.tag).slice(0, 10).join(", ") || "No hay bots verificados.";
            const nonVerifiedBotNames = nonVerifiedBots.map(bot => bot.user.tag).slice(0, 10).join(", ") || "No hay bots no verificados.";

            // Enviar el log al canal correspondiente con más información
            if (logChannel) {
                logChannel.send({
                    embeds: [new Discord.MessageEmbed()
                        .setThumbnail(guild.iconURL())
                        .setTitle('Nuevo Servidor.')
                        .setDescription(
                            `Servidor: ${guild.name} (${guild.id})\n` +
                            `Fundador: ${founder.tag} (${founder.id})\n` +
                            `Idioma: ${guild.preferredLocale}\n` +
                            `Roles: ${guild.roles.cache.size}\n` +
                            `Miembros: ${guild.memberCount}`
                        )
                        .addField("Bots verificados", verifiedBotNames, false)
                        .addField("Bots no verificados", nonVerifiedBotNames, false)
                        .setTimestamp()
                        .setColor("#FDFDFD")
                        .setFooter(`${guild.name}`, `${guild.iconURL()}`)
                    ]
                }).catch(err => console.error('Error enviando el log del nuevo servidor:', err));
            }

            // Enviarte un MD con la misma información del servidor
            const myUserId = "1216532655592439862";
            const user = await client.users.fetch(myUserId);
            if (user) {
                user.send({
                    embeds: [new Discord.MessageEmbed()
                        .setThumbnail(guild.iconURL())
                        .setTitle('Nuevo Servidor.')
                        .setDescription(
                            `Servidor: ${guild.name} (${guild.id})\n` +
                            `Fundador: ${founder.tag} (${founder.id})\n` +
                            `Idioma: ${guild.preferredLocale}\n` +
                            `Roles: ${guild.roles.cache.size}\n` +
                            `Miembros: ${guild.memberCount}`
                        )
                        .addField("Bots verificados", verifiedBotNames, false)
                        .addField("Bots no verificados", nonVerifiedBotNames, false)
                        .setTimestamp()
                        .setColor("#FDFDFD")
                        .setFooter(`${guild.name}`, `${guild.iconURL()}`)
                    ]
                }).catch(err => console.error('Error enviando el MD a ti:', err));
            }

            // Comprobar si el fundador está en la blacklist
            let blockedUser = await Blacklist.findOne({ userId: guild.ownerId });

            if (blockedUser) {
                // Si el fundador está en la blacklist, el bot abandona el servidor
                founder.send({
                    embeds: [new Discord.MessageEmbed()
                        .setTitle('Has sido baneado')
                        .setDescription(`Has sido baneado del servidor **${guild.name}** debido a estar en la blacklist.`)
                        .setColor("#FF0000")
                        .setTimestamp()
                    ]
                }).catch(err => console.error('Error enviando el mensaje de blacklist al fundador:', err));

                await guild.leave().catch(err => console.error('Error dejando el servidor:', err));

            } else {
                // Crear invitación del primer canal de texto disponible
                const inviteChannel = guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT');
                if (inviteChannel) {
                    inviteChannel.createInvite({ maxAge: 0, maxUses: 0 })
                        .then(invite => {
                            // Mensaje de bienvenida al fundador con la invitación
                            const welcomeEmbed = new Discord.MessageEmbed()
                                .setAuthor(guild.name, guild.iconURL())
                                .setDescription(
                                    `NearSecurity, versión ${version}\n\n` +
                                    `¡Gracias por invitarme! Te animo a probar comandos como \`n!comandos\`, \`n!ayuda\` o incluso hacerme tag para obtener información sobre mí.\n\n` +
                                    `Invitación para compartir: ${invite.url}\n` +
                                    `> <:windows_security:1277361559114481715> A partir de ahora, serás protegido.\n` +
                                    `> <:Cyan_crown:1279260496872345694> Serás tratado como un rey\n` +
                                    `> <:Cashapp:1279260668314517526> ¡Y todo **gratis**!\n\n` +
                                    `**Anuncios**\n` +
                                    `> <:Verified_Seagull:1279260683904749628> ¡Buscamos la verificación! Ayúdanos a mejorar y verificar.\n` +
                                    `> <:Partner_Seagull:1279260613956075623> ¿Quieres ser Partner? Únete a nuestro [soporte](https://discord.gg/a7FqNnHk2m) y habla con los staff.\n\n<a:a_moderation:953183975583670302> **AVISO DE SEGURIDAD:** Instamos que le den el rol más alto al bot, si necesitan poner a alguien en whitelist, utilicen **n!whitelist**, pero después pasa que raidean el servidor y el bot no puede hacer nada.`
                                )
                                .setColor("#FDFDFD")

                            founder.send({ embeds: [welcomeEmbed] })
                                .catch(err => console.error('Error enviando el mensaje de bienvenida al fundador:', err));

                            // Enviar el mismo embed a un canal aleatorio donde el bot pueda escribir
                            const textChannels = guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT' && channel.permissionsFor(client.user).has('SEND_MESSAGES'));
                            if (textChannels.size > 0) {
                                const randomChannel = textChannels.random(); // Selecciona un canal aleatorio
                                randomChannel.send({ embeds: [welcomeEmbed] })
                                    .catch(err => console.error('Error enviando el embed a un canal aleatorio:', err));
                            } else {
                                console.error('No se encontraron canales de texto donde el bot pueda enviar mensajes.');
                            }
                        })
                        .catch(err => console.error('Error creando la invitación:', err));
                } else {
                    console.error('No se encontró un canal de texto para crear la invitación.');
                }
            }

            // Control de la cantidad de servidores a los que puede invitar el usuario
            setTimeout(async () => {
                if (blockedUser) {
                    if (blockedUser.serversCreated.date !== new Date().getDay()) {
                        blockedUser.serversCreated = {
                            servers: 1,
                            date: new Date().getDay()
                        };
                    } else if (blockedUser.serversCreated.servers >= 3) {
                        founder.send('¡Para el carro colega! Hoy ya me has añadido en tres servidores, me podrás añadir mañana.').catch(err => console.error('Error enviando el mensaje de límite alcanzado:', err));
                        guild.leave();
                    } else {
                        blockedUser.serversCreated.servers += 1;
                    }
                    blockedUser.save().catch(err => console.error('Error guardando los datos del usuario:', err));
                }
            }, 3000);
        }
    } catch (err) {
        console.error('Error manejando el evento guildCreate:', err);
    }
};

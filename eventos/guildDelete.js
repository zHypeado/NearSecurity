//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const Discord = require('discord.js-light');
const Guild = require('../schemas/guildsSchema');

module.exports = async (client, guild) => {
    try {
        await Guild.findOneAndDelete({ id: guild.id });

        const logChannel = await client.channels.fetch("YOUR-STAFF-LOGS-CHANNEL");
        if (logChannel) {
            logChannel.send({
                embeds: [new Discord.MessageEmbed()
                    .setThumbnail(`${guild.iconURL()}`)
                    .setTitle('Me han expulsado de un servidor.')
                    .addField('Servidor', `${guild.name} (${guild.id})`)
                    .addField('Idioma', `${guild.preferredLocale}`)
                    .addField('Roles', `${guild.roles.cache.size}`)
                    .addField('Miembros', `${guild.memberCount}`)
                    .setTimestamp()
                    .setColor("#FDFDFD")
                    .setFooter(`${guild.name}`, `${guild.iconURL()}`)
                ]
            }).catch(err => console.error('Error enviando la notificación de expulsión:', err));
        }

        // Enviar MD con la notificación
        const myUserId = "1216532655592439862"; // Tu ID
        const user = await client.users.fetch(myUserId);
        if (user) {
            user.send({
                embeds: [new Discord.MessageEmbed()
                    .setTitle('El bot ha sido expulsado de un servidor.')
                    .addField('Servidor', `${guild.name} (${guild.id})`)
                    .addField('Idioma', `${guild.preferredLocale}`)
                    .addField('Roles', `${guild.roles.cache.size}`)
                    .addField('Miembros', `${guild.memberCount}`)
                    .setTimestamp()
                    .setColor("#FF0000")
                ]
            }).catch(err => console.error('Error enviando el MD sobre expulsión:', err));
        }
    } catch (err) {
        console.error('Error manejando el evento guildDelete:', err);
    }
};

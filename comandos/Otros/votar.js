const Discord = require('discord.js-light');
const { fecthUsersDataBase } = require('../../functions');

module.exports = {
    nombre: "votar",
    category: "Otros",
    premium: false,
    alias: ['vote', 'votacion'],
    description: "Vota por nosotros en las botlists.",
    usage: ['<prefix>votar'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
        
        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });
                console.log("Resultado de la búsqueda de blacklist:", user);
                
                if (user && user.removedAt == null) {
                    return true; // Usuario sigue en la blacklist
                }
                return false; // Usuario no está en blacklist o fue removido
            } catch (err) {
                console.error('Error buscando en la blacklist:', err);
                return false;
            }
        }

        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        console.log("¿Está en blacklist?", isBlacklisted);
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }

        let user = await fecthUsersDataBase(client, message.author, false);
        if (!user) return message.reply('Error: Tu documento en la base de datos no está definido.');
        user = { premium: {} };

        const { MessageActionRow, MessageButton } = Discord;

        // Primera fila de botones (máximo 5 botones)
        const row1 = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Votar en botlist.me')
                    .setStyle('LINK')
                    .setURL('https://botlist.me/bots/1277124708369961021'),
                new MessageButton()
                    .setLabel('Votar en ExtremeBotlist')
                    .setStyle('LINK')
                    .setURL('https://discordextremelist.xyz/en-US/bots/1277124708369961021'),
                new MessageButton()
                    .setLabel('Votar en ShadowBotlist')
                    .setStyle('LINK')
                    .setURL('https://botlist.app/1144530103058042881/1277124708369961021?type=mcservers'),
                new MessageButton()
                    .setLabel('Votar en DiscordBots')
                    .setStyle('LINK')
                    .setURL('https://discord.bots.gg/bots/1277124708369961021'),
                new MessageButton()
                    .setLabel('Votar en DiscordBotlist.com')
                    .setStyle('LINK')
                    .setURL('https://discordbotlist.com/bots/nearsecurity')
            );

        // Segunda fila de botones (el botón adicional)
        const row2 = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Votar en Radarcord')
                    .setStyle('LINK')
                    .setURL('https://radarcord.net/bot/1277124708369961021')
            );

        let embed = new Discord.MessageEmbed()
            .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
            .setTitle('<:Vote:1279668030833430619> ¡Vota por nosotros!')
            .setDescription('¡Hey, ya somos internacionales! Ahora estamos en las llamadas botlist, son páginas donde puedes buscar bots y votar por ellos para mejorar su reputación.\n\n**Vota por nosotros en los botones**')
            .setFooter('NearSecurity')
            .setImage("https://cdn.discordapp.com/attachments/1277170460924317777/1279309437483614228/votar.jpg");

        message.channel.send({ embeds: [embed], components: [row1, row2] }).catch(err => {
            console.error('Error al enviar el embed de votación con botones:', err);
            message.channel.send({ content: 'Hubo un problema al enviar el mensaje de votación.' });
        });
    }
};

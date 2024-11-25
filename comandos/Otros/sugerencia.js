const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const _sugerencia = new Discord.MessageEmbed().setColor("#FDFDFD");

module.exports = {
    nombre: "sugerencia",
    category: "Otros",
    premium: false,
    alias: ["suggest"],
    description: "¿Alguna sugerencia sobre el bot?",
    usage: ['<prefix>queja <message>'],
    run: async (client, message, args, _guild) => {
        
                const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
    try {
        const user = await Blacklist.findOne({ userId });
        console.log("Resultado de la búsqueda de blacklist:", user); // Registro para verificar si encuentra al usuario
        
        // Si el usuario existe en la blacklist pero tiene un removedAt definido, ya no está en blacklist
        if (user && user.removedAt == null) {
            return true; // Usuario sigue en la blacklist
        }

        return false; // Usuario no está en blacklist o fue removido
    } catch (err) {
        console.error('Error buscando en la blacklist:', err);
        return false; // En caso de error, asume que no está en blacklist
    }
}
        // Verificar si el usuario está en la blacklist
        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        console.log("¿Está en blacklist?", isBlacklisted); // Registro para ver si detecta correctamente
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }
        
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);
        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.others.sugerencia.message1 +'.\n\n' + _guild.configuration.prefix + 'sugerencia <message>'));

        message.channel.send({ content: '' + LANG.commands.others.sugerencia.message2 + ' `enviar`' });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {                    
                if(`${m.content}`.toLowerCase() == 'enviar') {
                    _sugerencia.setDescription(args.join(' ')).setTitle('' + LANG.commands.others.sugerencia.message3 + '.');
                    message.reply({ embeds: [ _sugerencia ], ephemeral: true });
                    client.channels.cache.get("YOUR-STAFF-LOGS-CHANNEL").send({ embeds: [ _sugerencia.setTitle('Sugerencia.').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL) ] });
                    collector.stop();
                }else {
                    message.channel.send({ content: '' + LANG.commands.others.sugerencia.message4 +'.' });
                    collector.stop();
                }
            }
        });
    }
}
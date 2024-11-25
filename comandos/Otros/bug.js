const Discord = require('discord.js-light');
const { dataRequired, fecthUsersDataBase } = require('../../functions');
const _bug = new Discord.MessageEmbed().setColor("#FDFDFD");

module.exports = {
    nombre: "bug",
    category: "Otros",
    premium: false,
    alias: [],
    description: "¿Alguna bug sobre el bot?",
    usage: ['<prefix>bug <message>'],
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

        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.others.bug.message1 + '.\n\n' + _guild.configuration.prefix + 'bug <message>'));
        
        message.channel.send({ content: `${LANG.commands.others.bug.message2}.` });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {                    
                if(`${m.content}`.toLowerCase() == 'enviar') { // esto hay que ver con los lenguajes para que si está en inglés tengas que poner send en vez de enviar, etc.
                    _bug.setDescription(args.join(' ')).setTitle(`${LANG.commands.others.bug.message3}.`);
                    message.reply({ embeds: [ _bug ], ephemeral: true });
                    client.channels.cache.get("YOUR-STAFF-BUG-CHANNEL").send({ embeds: [ _bug.setTitle('Bug.').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL) ] });
                    collector.stop();
                }else {
                    message.channel.send({ content: `${LANG.commands.others.bug.message4}.` });
                    collector.stop();
                }
            }
        });

        let user = await fecthUsersDataBase(client, message.author);
        if(user && user.achievements.data.bugs >= 2 && !user.achievements.array.includes('Cazador de bugs.')) {
            message.channel.send({ content: 'Acabas de obtener un logro, mira tu perfil.' });
            user.achievements.array.push('Cazador de bugs.');
            user.save();
        }
    }
}
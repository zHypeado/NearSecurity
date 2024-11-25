const Discord = require('discord.js-light');
const { dataRequired, pulk } = require('../../functions');

module.exports = {
    nombre: "bloq-entrities-by-name",
    category: "Protección",
    premium: false,
    alias: ['bloqentritiesbyname', 'bebn'],
    description: "Haz que el bot expulse usuarios con nombres que no desees.",
    usage: ['<prefix>bloqEntritiesByName {add, remove, clearAll}'],
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

        if(!message.guild.me.permissions.has('BAN_MEMBERS'))return message.channel.send(`Necesito el permiso para __Banear miembros__.`);
        if(message.author.id != message.guild.ownerId)return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if(!args[0])return message.reply(await dataRequired('' + LANG.commands.protect.bebn.message1 + '.\n\n' + _guild.configuration.prefix + 'bebn {add, remove, clearAll}'));

        if(args[0] == 'add') {

            if(!args[1])return message.reply(await dataRequired('' + LANG.commands.protect.bebn.message2 + '.\n\n' + _guild.configuration.prefix + 'bebn add <newBadword>'));
            _guild.protection.bloqEntritiesByName.names.push(args[1].toLowerCase());
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.bebn.message3} \`${args[1].toLowerCase()}\` ${LANG.commands.protect.bebn.message4}.` });

        }else if(args[0] == 'remove') {

            if(_guild.protection.bloqEntritiesByName.names.length == 0)return message.reply({ content: `${LANG.commands.protect.bebn.message5}.` });
            let cc = 1;
            message.reply({ embeds: [ new Discord.MessageEmbed().setColor("#FDFDFD").setDescription(`${LANG.commands.protect.bebn.message6}.\n\n${_guild.protection.bloqEntritiesByName.names.map(x => `\`${cc++}-\` ${x}`).join('\n')}`) ] }).catch(err => {});
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {
                    if(isNaN(m.content)) {
                        message.reply(`${LANG.commands.protect.bebn.message7}.`);
                        return collector.stop();
                    }
                    if(m.content > _guild.protection.bloqEntritiesByName.names) {
                        message.reply(`${LANG.commands.protect.bebn.message8}.`);
                        return collector.stop();
                    }

                    message.channel.send({ content: `${LANG.commands.protect.bebn.message9} ${m.content}, "${_guild.protection.bloqEntritiesByName.names[m.content - 1]}", ${LANG.commands.protect.bebn.message10}.` });
                    _guild.protection.bloqEntritiesByName.names = await pulk(_guild.protection.bloqEntritiesByName.names, _guild.protection.bloqEntritiesByName.names[m.content - 1]);
                    updateDataBase(client, message.guild, _guild, true);
                    collector.stop();
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: `${LANG.commands.protect.bebn.message11}.` });
            });

        }else if(args[0] == 'clearAll') {
            _guild.protection.bloqEntritiesByName.names = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.bebn.message12}.` });
        }else{
            message.reply(await dataRequired('' + LANG.commands.protect.bebn.message13 + '\n\n' + _guild.configuration.prefix + 'bebn {add, remove, clearAll}'));
        }
    },
}
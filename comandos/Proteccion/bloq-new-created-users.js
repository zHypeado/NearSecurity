const Discord = require('discord.js-light');
const ms = require('ms');
const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: "bloq-new-created-users",
    category: "Protección",
    premium: false,
    alias: ['bloqnewcreatedusers', 'bncu'],
    description: "Haz que solo usuarios con determinado tiempo en Discord puedan entrar a tu servidor.",
    usage: ['<prefix>bloqnewcreatedusers <time>'],
    run: async (client, message, args, _guild) => {

        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });

                if (user && user.removedAt == null) {
                    return true;
                }

                return false;
            } catch (err) {
                return false;
            }
        }

        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }

        if (!message.guild.members.me.permissions.has('BAN_MEMBERS')) {
            return message.channel.send('El bot no tiene permisos para __Banear miembros__.');
        }

        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.channel.send('No tienes permisos para __Banear miembros__.');
        }

        if (!args[0]) return message.reply(await dataRequired('Debes especificar el tiempo.\n\n' + _guild.configuration.prefix + 'bncu <time>'));
        
        let time = ms(args[0]);
        if (!time) return message.reply('Error: No se ha ingresado un tiempo válido.');
        
        if (time < 300000) {
            time = 300000;
            args[0] = '5m';
        }

        _guild.protection.bloqNewCreatedUsers.time = ms(time);
        _guild.protection.bloqNewCreatedUsers.enable = true;
        updateDataBase(client, message.guild, _guild, true);
        message.reply({ content: `Usuarios con cuentas creadas hace menos de \`${ms(time)}\` serán bloqueados de este servidor.` });
    },
}

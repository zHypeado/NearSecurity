const Discord = require('discord.js-light');
const Sanction = require('../../schemas/sanctionSchema');
const { dataRequired } = require('../../functions');

module.exports = {
    nombre: 'ban',
    category: 'Moderación',
    premium: false,
    alias: ['martillo'],
    description: 'Banea a un usuario de tu servidor.',
    usage: ['<prefix>ban <userMention> [reason]'],
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

        // Comprobación de permisos
        if (!message.guild.me.permissions.has('BAN_MEMBERS')) {
            return message.channel.send({ content: LANG.data.permissionsBanMe });
        }
        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.channel.send({ content: LANG.data.permissionsBan });
        }

        // Obtener el usuario mencionado
        let userMention = message.mentions.members.first();
        if (!userMention) {
            return message.reply(await dataRequired(LANG.commands.mod.ban.message1 + '\n\n' + _guild.configuration.prefix + 'ban <userMention> [reason]'));
        }
        if (userMention.id === client.user.id) {
            return; // No puedes banear al bot.
        }
        if (userMention.id === message.author.id) {
            return message.reply(LANG.commands.mod.ban.message2);
        }
        if (message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0) {
            return message.reply(LANG.commands.mod.ban.message3);
        }

        // Verificar y manejar razones obligatorias
        if (_guild.moderation.dataModeration.forceReasons.length > 0) {
            if (!args[1]) {
                return message.reply(await dataRequired(LANG.commands.mod.ban.message4 + '\n\n' + _guild.configuration.prefix + 'ban <userMention> <reason>\n\n' + LANG.commands.mod.ban.message5 + ' ' + _guild.moderation.dataModeration.forceReasons.join(', ')));
            }
            if (!_guild.moderation.dataModeration.forceReasons.includes(args[1])) {
                return message.reply(await dataRequired(LANG.commands.mod.ban.message6 + '\n\n' + _guild.configuration.prefix + 'ban <userMention> <reason>\n\n' + LANG.commands.mod.ban.message5 + ' ' + _guild.moderation.dataModeration.forceReasons.join(', ')));
            }
        }

        // Establecer razón por defecto si no se proporciona
        let reason = args.slice(1).join(' ') || LANG.commands.mod.ban.message7;

        if (!userMention.bannable) {
            return message.reply(LANG.commands.mod.ban.message8);
        }

        // Enviar mensaje al usuario baneado
        let userID = client.users.cache.get(userMention.id);
        userID.send(LANG.commands.mod.ban.message9
            .replace('<guild>', message.guild.name)
            .replace('<moderator>', message.author.tag)
            .replace('<reason>', reason)
        ).catch(err => {});

        // Bannear al usuario
        userMention.ban({ reason: reason })
            .then(async () => {
                // Guardar la sanción en la base de datos
                const newSanction = new Sanction({
                    userId: userMention.id,
                    guildId: message.guild.id,
                    moderatorId: message.author.id,
                    sanctionType: 'ban',
                    reason: reason
                });
                await newSanction.save();

                // Crear y enviar el embed de ban
                let banEmbed = new Discord.MessageEmbed()
                    .setDescription(LANG.commands.mod.ban.message10
                        .replace('<userMention>', `<@${userMention.id}>`)
                        .replace('<userMentionId>', userMention.id)
                        .replace('<authorMention>', `<@${message.author.id}>`)
                        .replace('<authorId>', message.author.id)
                        .replace('<reason>', reason)
                    )
                    .setTimestamp()
                    .setColor("#FDFDFD");

                message.channel.send({ embeds: [banEmbed] });
            })
            .catch(err => {
                message.reply(LANG.commands.mod.ban.message11 || 'No se pudo banear al usuario.');
                console.error('Error al banear al usuario:', err);
            });
    },
};
const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const Sanction = require('../../schemas/sanctionSchema'); // Asegúrate de que este schema exista

module.exports = {
    nombre: 'kick',
    category: 'Moderación',
    premium: false,
    alias: ['expulsar'],
    description: 'Expulsa a un usuario de tu servidor.',
    usage: ['<prefix>kick <userMention> [reason]'],
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
        
        let LANG = {
            commands: {
                mod: {
                    kick: {
                        message1: 'Por favor menciona a un usuario.',
                        message2: '<:Crossmark:1278179784433864795> | No puedes expulsarte a ti mismo.',
                        message3: '<:Crossmark:1278179784433864795> | No puedes expulsar a un usuario de igual o mayor rango.',
                        message4: '<:Crossmark:1278179784433864795> | Necesitas proporcionar una razón para expulsar.',
                        message5: 'Razones válidas: ',
                        message6: '<:Crossmark:1278179784433864795> | La razón proporcionada no es válida.',
                        message7: 'Sin razón especificada.',
                        message8: '<:Crossmark:1278179784433864795> | No puedo expulsar a este usuario.',
                        message9: 'Has sido expulsado de **<guild>** por **<moderator>**. Razón: **<reason>**.',
                        message10: '<:Checkmark:1278179814339252299> | El usuario <userMention> con ID <userMentionId> ha sido expulsado por <authorMention> con ID <authorId> por la razón: <reason>.',
                        message11: '<:Crossmark:1278179784433864795> | No se pudo expulsar al usuario.',
                    }
                }
            }
        };

        if (!message.guild.members.me.permissions.has('KICK_MEMBERS')) {
            return message.channel.send({ content: LANG.data.permissionsKickMe });
        }
        if (!message.member.permissions.has('KICK_MEMBERS')) {
            return message.channel.send({ content: LANG.data.permissionsKick });
        }

        let userMention = message.mentions.members.first();
        if (!userMention) {
            return message.reply(await dataRequired(LANG.commands.mod.kick.message1 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> [reason]'));
        }
        if (userMention.id === client.user.id) {
            return; // No puedes expulsar al bot.
        }
        if (userMention.id === message.author.id) {
            return message.reply(LANG.commands.mod.kick.message2);
        }
        if (message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0) {
            return message.reply(LANG.commands.mod.kick.message3);
        }

        // Verificar y manejar razones obligatorias
        if (_guild.moderation.dataModeration.forceReasons.length > 0) {
            if (!args[1]) {
                return message.reply(await dataRequired(LANG.commands.mod.kick.message4 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\n' + LANG.commands.mod.kick.message5 + ' ' + _guild.moderation.dataModeration.forceReasons.join(', ')));
            }
            if (!_guild.moderation.dataModeration.forceReasons.includes(args[1])) {
                return message.reply(await dataRequired(LANG.commands.mod.kick.message6 + '\n\n' + _guild.configuration.prefix + 'kick <userMention> <reason>\n\n' + LANG.commands.mod.kick.message5 + ' ' + _guild.moderation.dataModeration.forceReasons.join(', ')));
            }
        }

        // Establecer razón por defecto si no se proporciona
        let reason = args.slice(1).join(' ') || LANG.commands.mod.kick.message7;

        if (!userMention.kickable) {
            return message.reply(LANG.commands.mod.kick.message8);
        }

        // Enviar mensaje al usuario expulsado
        let userID = client.users.cache.get(userMention.id);
        userID.send(LANG.commands.mod.kick.message9
            .replace('<guild>', message.guild.name || 'Servidor Desconocido')
            .replace('<moderator>', message.author.tag || 'Moderador Desconocido')
            .replace('<reason>', reason || 'Sin Razón')
        ).catch(err => {
            console.error('Error al enviar mensaje al usuario expulsado:', err);
        });

        // Expulsar al usuario
        try {
            await userMention.kick(reason);
            
            // Registrar la sanción en la base de datos
            const newSanction = new Sanction({
                guildId: message.guild.id,
                userId: userMention.id,
                action: 'KICK',
                moderator: message.author.id,
                reason: reason
            });
            await newSanction.save();

            let kickEmbed = new Discord.MessageEmbed()
                .setDescription((LANG.commands.mod.kick.message10 || 'El usuario <userMention> con ID <userMentionId> ha sido expulsado por <authorMention> con ID <authorId> por la razón: <reason>.')
                    .replace('<userMention>', `<@${userMention.id}>`)
                    .replace('<userMentionId>', userMention.id)
                    .replace('<authorMention>', `<@${message.author.id}>`)
                    .replace('<authorId>', message.author.id)
                    .replace('<reason>', reason)
                )
                .setTimestamp()
                .setColor("#FDFDFD");

            message.channel.send({ embeds: [kickEmbed] });
        } catch (err) {
            message.reply(LANG.commands.mod.kick.message11 || 'No se pudo expulsar al usuario.');
            console.error('Error al expulsar al usuario:', err);
        }
    },
};
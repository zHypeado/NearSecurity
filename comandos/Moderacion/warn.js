const Discord = require('discord.js-light');
const Timers = require('../../schemas/timersSchema');
const Warns = require('../../schemas/warnsSchema');
const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'warn',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Agrega un aviso a un usuario.',
	usage: ['<prefix>warn <userMention> [reason]'],
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
                    warn: {
                        message1: 'Por favor menciona un usuario o proporciona un ID válido.',
                        message2: '<:Alert:1278748088789504082> | Necesitas proporcionar una razón para el aviso.',
                        message3: 'Razones permitidas',
                        message4: '<:Alert:1278748088789504082> | La razón proporcionada no es válida.',
                        message5: '<:Checkmark:1278179814339252299> | Has agregado un aviso a',
                        message6: 'avisos.',
                        message7: 'Moderador responsable',
                        message8: '<:Alert:1278748088789504082> | El usuario ha alcanzado el límite de avisos.',
                        message9: '<:Checkmark:1278179814339252299> | El usuario ha sido silenciado.',
                        message10: 'No repitas la acción del moderador automáticamente.',
                        message11: '<:Checkmark:1278179814339252299> | El usuario ha sido baneado.',
                        message12: 'No puedes usar ese rol.',
                        message13: 'La acción será revertida.',
                        message14: '<:Crossmark:1278179784433864795> | No he podido mutear al usuario.',
                        message15: '<:Crossmark:1278179784433864795> | No he podido banear al usuario.',
                        message16: 'Un nuevo usuario ha sido baneado.',
                        message17: 'Sin razón proporcionada.'
                    }
                }
            }
        };

        if(!message.guild.members.me.permissions.has('SEND_MESSAGES')) return message.channel.send(`${LANG.data.permissionsRolesme}.`);
        if(!message.member.permissions.has('MANAGE_MESSAGES')) return message.channel.send(`${LANG.data.permissionsMessages}.`);

        let userMention = message.mentions.members.first();
        if(!userMention) return message.reply(await dataRequired(`${LANG.commands.mod.warn.message1}\n\n` + _guild.configuration.prefix + 'warn <userMention> [reason]'));
        if(_guild.moderation.dataModeration.forceReasons.length > 0) {
            if(!args[1]) return message.reply(await dataRequired(`${LANG.commands.mod.warn.message2}\n\n` + _guild.configuration.prefix + 'warn <userMention> <reason>\n\n' + LANG.commands.mod.warn.message3 + ': ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
            if(!_guild.moderation.dataModeration.forceReasons.includes(args[1])) return message.reply(await dataRequired(`${LANG.commands.mod.warn.message4}\n\n` + _guild.configuration.prefix + 'warn <userMention> <reason>\n\n' + LANG.commands.mod.warn.message3 + ': ' + _guild.moderation.dataModeration.forceReasons.map(x => `${x}`).join(', ')));
        }
        if(!args[1]) args[1] = `${LANG.commands.mod.warn.message17}.`;

        let userWarns = await Warns.findOne({ guildId: message.guild.id, userId: userMention.id });
        if(userWarns) {
            userWarns.warns.push({
                reason: args.join(' ').split(`${userMention.id}> `)[1],
                moderator: message.author.id,
            });
            userWarns.save();
        } else {
            let newUser = new Warns({
                guildId: message.guild.id,
                userId: userMention.id,
                warns: [{
                    reason: args.join(' ').split(`${userMention.id}> `)[1],
                    moderator: message.author.id
                }],
                subCount: 0
            });
            userWarns = newUser;
            newUser.save();
        }

        message.reply({ embeds: [ new Discord.MessageEmbed().setColor("#FDFDFD").setDescription(`<@${userMention.id}>, ${LANG.commands.mod.warn.message5} ${userWarns.warns.length} ${LANG.commands.mod.warn.message6}: \`${args.join(' ').split(`${userMention.id}> `)[1]}\`\n${LANG.commands.mod.warn.message7}: \`${message.author.tag}\``) ] });

        // Automoderación y silenciamiento
        if(_guild.moderation.automoderator.enable == true) {
            if(userWarns.warns.length == _guild.moderation.automoderator.actions.warns[0]) {
                // Lógica de silenciamiento...
                message.reply({ content: `${LANG.commands.mod.warn.message9} \`${userMention.user.username}\` ${LANG.commands.mod.warn.message10}.`, components: [
                    new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('dontRepeatTheAutomoderatorAction').setLabel(`${LANG.commands.mod.warn.message11}.`).setStyle('DANGER'))
                ] });
            } else if(userWarns.warns.length == _guild.moderation.automoderator.actions.warns[1]) {
                userMention.ban({ reason: args.join(' ').split(`${userMention.id}> `)[1] });
                message.reply({ content: `${LANG.commands.mod.warn.message12} \`${userMention.user.username}\`\n\n> ${LANG.commands.mod.warn.message13}.`, components: [
                    new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('dontRepeatTheAutomoderatorAction').setLabel(`${LANG.commands.mod.warn.message14}.`).setStyle('DANGER'))
                ] });
            }
        }
    },
};
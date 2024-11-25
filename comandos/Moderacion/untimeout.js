const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const Sanction = require('../../schemas/sanctionSchema'); // Asegúrate de que este schema exista

module.exports = {
	nombre: 'untimeout',
	category: 'Moderación',
	premium: false,
	alias: ['ut'],
	description: 'Eliminar el aislamiento de un usuario.',
	usage: ['<prefix>t <userMention>'],
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
                    untimeout: {
                        message1: 'Por favor menciona un usuario.',
                        message2: '<:Alert:1278748088789504082> | No puedes quitar el timeout a ti mismo.',
                        message3: '<:Crossmark:1278179784433864795> | No puedes quitar el timeout a un usuario de igual o mayor rango.',
                        message4: '<:Crossmark:1278179784433864795> | No puedo quitar el timeout a este usuario.',
                        message5: '<:Checkmark:1278179814339252299> | Timeout eliminado para',
                        message6: '<:Crossmark:1278179784433864795> | No he podido eliminar el timeout para'
                    }
                }
            }
        };

		if (!message.guild.members.me.permissions.has('MODERATE_MEMBERS')) 
            return message.channel.send(`Necesito el permiso para __Moderar miembros__..`);
        if (!message.member.permissions.has('MODERATE_MEMBERS')) 
            return message.channel.send(`Necesitas el permiso para __Moderar miembros__..`);

		let userMention = message.mentions.members.first();
        if (!userMention) 
            return message.reply(await dataRequired(`${LANG.commands.mod.untimeout.message1}\n\n` + _guild.configuration.prefix + 't <userMention>'));

        if (userMention.id == client.user.id) return;
		if (userMention.id == message.author.id) 
            return message.reply(`${LANG.commands.mod.untimeout.message2}.`);
		if (message.member.roles.highest.comparePositionTo(userMention.roles.highest) <= 0) 
            return message.reply(`${LANG.commands.mod.untimeout.message3}.`);
        if (!userMention.moderatable) 
            return message.reply({ content: `${LANG.commands.mod.untimeout.message4}.` });

        userMention.timeout(null).then(async () => {
            // Registrar la sanción en la base de datos
            const newSanction = new Sanction({
                guildId: message.guild.id,
                userId: userMention.id,
                action: 'UNTIMEOUT',
                moderator: message.author.id,
                reason: LANG.commands.mod.untimeout.message5 // Añade una razón si es necesario
            });
            await newSanction.save();

            message.reply({ content: `${LANG.commands.mod.untimeout.message5} \`${userMention.user.username}\`. ✅` });
        }).catch(() => {
            message.reply({ content: `${LANG.commands.mod.untimeout.message6} \`${userMention.user.username}\` ❌` });
        });
	},
};
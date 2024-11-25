const { dataRequired } = require("../../functions");
const clear = new Map();

module.exports = {
	nombre: 'clear',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Borra los mensajes de un canal de forma rápida.',
	usage: ['<prefix>clear <messagesAmount>'],
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

        if(!message.guild.members.me.permissions.has('MANAGE_MESSAGES'))return message.reply(LANG.data.permissionsMessagesMe);
        if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.reply(LANG.data.permissionsMessages);

        if(!args[0])return message.reply(await dataRequired(LANG.commands.mod.clear.message1 + '\n\n' + _guild.configuration.prefix + 'clear <messagesAmount>'));
        if(isNaN(parseInt(args[0])))return message.reply(LANG.commands.mod.clear.message2);
        if(parseInt(args[0]) < 0) args[0] = parseInt(args[0]) - parseInt(args[0]) - parseInt(args[0]);

        try{
            if(parseInt(args[0]) > 100) {
                message.reply(LANG.commands.mod.clear.message3.replace('<amopunt>', args[0]));
                if(clear.has(message.guild.id))return message.reply(LANG.commands.mod.clear.message4.replace('<amount>', await clear.get(message.guild.id)));
                clear.set(message.guild.id, parseInt(args[0]));
                function c(amount) {
                    setTimeout(() => {
                        if(amount > 100) {
                            message.channel.bulkDelete(100);
                            let newAmount = amount - 100;
                            c(newAmount);
                            clear.set(message.guild.id, newAmount);                   
                        }else{
                            clear.delete(message.guild.id);
                            message.channel.bulkDelete(amount);
                        }
                    }, 2000);
                }
                c(parseInt(args[0]));
            }else{
                message.channel.bulkDelete(parseInt(args[0]));
                message.reply(LANG.commands.mod.clear.message5.replace('amount', args[0]));
            }
        }catch(err) {}
    },
};
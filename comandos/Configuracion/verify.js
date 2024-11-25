const { dataRequired } = require("../../functions");

module.exports = {
	nombre: 'verify',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Verifica a un usuario nuevo en tu servidor.',
	usage: ['<prefix>verify <userMention>'],
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

        try{
            if(!message.guild.members.me.permissions.has('MANAGE_ROLES')) return message.reply({ content: LANG.data.permissionsADMINme });
            if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: LANG.data.permissionsManageRoles });

            let member = message.mentions.members.first();
            if(!member)return message.reply(await dataRequired(LANG.commands.config.verify.message1 + '\n\n' + _guild.configuration.prefix + 'verify <userMention>'));

            if(_guild.protection.verification.enable == false)return message.reply(LANG.commands.config.verify.message2);
            if(member.roles.cache.has(_guild.protection.verification.role))return message.reply(LANG.commands.config.verify.message3);
            member.roles.add(_guild.protection.verification.role);
            message.reply(LANG.commands.config.verify.message4);
        }catch(err) {}
	},
};
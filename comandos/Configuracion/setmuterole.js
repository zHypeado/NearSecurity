const { dataRequired, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'setmuterole',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Establece un rol de muteo en el servidor.',
	usage: ['<prefix>setmurerole <roleMention>'],
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
	    
        if(!message.guild.members.me.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesito permisos de __Gestionar Roles__.' });
        if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply({ content: 'Necesitas permisos de __Gestionar Roles__.' });

        try{
            let roleMention = message.mentions.roles.first();
            if(!roleMention)return message.reply(await dataRequired('Debes mencionar el rol que deseas establecer como rol de muteo.\n\n' + _guild.configuration.prefix + 'setmuterole <roleMention>'));
            if(message.member.roles.highest.position <= roleMention.position)return message.reply('Ese rol está más alto que tu rol o tiene la misma posición.');
            if(!message.guild.roles.cache.has(roleMention.id))return message.reply('Este server no tiene ningún rol con esa id.');
            _guild.moderation.dataModeration.muterole = roleMention.id;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `El rol \`${roleMention.name}\` ha sido establecido con éxito.` });
        }catch(err) {}
	},
};
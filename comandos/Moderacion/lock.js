module.exports = {
	nombre: 'lock',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Bloquea un canal para que solo el personal pueda enviar mensajes.',
	usage: ['<prefix>lock [@roleMention]'],
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
        
        if(!message.guild.members.me.permissions.has('MANAGE_ROLES'))return message.reply('Necesito permisos de __Gestionar roles__.');
        if(!message.member.permissions.has('MANAGE_ROLES'))return message.reply('Necesitas permisos de __Gestionar roles__.');

        try{
            await message.guild.channels.fetch();
            let role = message.mentions.roles.first();
            if(role) {
                message.channel.permissionOverwrites.edit(role, {
                    SEND_MESSAGES: false
                }).catch(err => message.channel.send(err.toString()));
                message.react('👍');
            }else{
                message.channel.permissionOverwrites.edit(message.guild.id, {
                    SEND_MESSAGES: false
                }).catch(err => message.channel.send(err.toString()));
                message.react('👍');
            }
        }catch(err) {
            message.channel.send(err.toString());
        }
    },
};
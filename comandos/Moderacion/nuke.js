const Discord = require('discord.js-light');

module.exports = { 
	nombre: 'nuke',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Elimina todos los mensajes de un canal.',
	usage: ['<prefix>nuke'],
	run: async (client, message, _guild) => {
	    
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

		if(!message.guild.members.me.permissions.has('MANAGE_CHANNELS')) return message.channel.send(LANG.data.permissionsChannelsMe);
		if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.channel.send(LANG.data.permissionsChannelsU);

        message.reply({ content: "Estoy a punto de clonar este canal, ¡La acción es irreversible!\n\n¿Sabes lo que haces? Si estás seguro escribe `Seguro`" });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if(m.content == '')return;
            if(m.author.id == message.author.id) {
                if(m.content.toLowerCase() == 'seguro') {
                    message.channel.clone({ parent: message.channel.parentId, positon: message.channel.position }).then(nuke => {
                        message.channel.delete();
                        nuke.setPosition(message.channel.position).then(terminado => {
                            terminado.send({ content: '✅ | `Canal nukeado con éxito.`' });
                        });
                    });
                    collector.stop();
                }else{
                    collector.stop();
                }
            }
        });
        collector.on('end', () => {
            message.channel.send({ content: "Colector detenido." });
        });
	},
};
const Discord = require('discord.js-light');
const { dataRequired, pulk, updateDataBase } = require("../../functions");

module.exports = {
	nombre: 'forcereason',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Gestiona razones forzadas para acciones de moderación.',
	usage: ['<prefix>forcereason {add <newReason>, remove, clearAll}'],
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
	    
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply('Necesitas permisos de __Administrador__.');
        if(!args[0])return message.reply(await dataRequired('No has escrito el tipo de función.\n\n' + _guild.configuration.prefix + 'forcereason {add <newReason>, remove, clearAll}'));

        if(args[0] == 'add') {

            if(!args[1])return message.reply(await dataRequired('No has escrito la nueva razón forzada que agregarás.\n\n' + _guild.configuration.prefix + 'forcereason add <newReason>'));
            _guild.moderation.dataModeration.forceReasons.push(args.slice(1).join(' '));
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Razón forzada agregada.' });

        }else if(args[0] == 'remove') {

            if(_guild.moderation.dataModeration.forceReasons.length == 0)return message.reply({ content: 'No hay razones forzadas agregadas.' });
            let cc = 1;
            message.reply({ embeds: [ new Discord.MessageEmbed().setColor("#FDFDFD").setDescription(`Estás viendo las ${_guild.moderation.dataModeration.forceReasons.length} razones forzadas de este servidor, después de este mensaje escribe el numero adjunto a la razón forzada para eliminarla.\n\n${_guild.moderation.dataModeration.forceReasons.map(x => `\`${cc++}-\` ${x}`).join('\n')}`) ] });
            let collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', async m => {
                if(m.content == '')return;
                if(m.author.id == message.author.id) {                    
                    if(isNaN(m.content)) {
                        message.reply('Eso no era un número.');
                        return collector.stop();
                    }
                    if(m.content > _guild.moderation.dataModeration.forceReasons.length) {
                        message.reply('No he encontrado un número tan alto de razones forzadas.');
                        return collector.stop();
                    }

                    message.channel.send({ content: `La razón forzada número ${m.content} con el contenido "${_guild.moderation.dataModeration.forceReasons[m.content - 1]}" ha sido eliminado.` });
                    _guild.moderation.dataModeration.forceReasons = await pulk(_guild.moderation.dataModeration.forceReasons, _guild.moderation.dataModeration.forceReasons[m.content - 1]);
                    updateDataBase(client, message.guild, _guild, true);
                    collector.stop();
                }
            });
            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });

        }else if(args[0] == 'clearAll') {

            _guild.moderation.dataModeration.forceReasons = [];
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Razones forzadas reiniciadas.' });

        }else{
            message.reply(await dataRequired('¡Esa opción no es válida!\n\n' + _guild.configuration.prefix + 'forcereason {add <newReason>, remove, clearAll}'));
        }
    },
};
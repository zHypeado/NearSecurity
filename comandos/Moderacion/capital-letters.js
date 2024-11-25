const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'capital-letters',
	category: 'Moderación',
    premium: false,
	alias: ['capitalLetters', 'capitalletters'],
	description: 'Evita mensajes que incluyan muchas mayúsculas.',
	usage: ['<prefix>capitalLetters'],
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
        
        if(!message.guild.members.me.permissions.has('MODERATE_MEMBERS'))return message.channel.send('Necesito permiso de __Administrador__.');
        if(!message.member.permissions.has('MODERATE_MEMBERS'))return message.channel.send('Necesitas permiso de __Administrador__.');

        if(_guild.moderation.dataModeration.events.capitalLetters == false) {
            _guild.moderation.dataModeration.events.capitalLetters = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Detector de muchas mayúsculas activado, vuelve a escribir el comando para desactivarlo.' });
        }else{
            _guild.moderation.dataModeration.events.capitalLetters = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: 'Detector de muchas mayúsculas desactivado.' });
        }

    },
}
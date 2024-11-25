const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antitokens',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Los usuarios considerados como usuarios zombies (Selfbots o bots que se hacen pasar por humanos) serán expulsados/baneados del servidor al unirse a este.',
	usage: ['<prefix>antitokens'],
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
    
        if(!message.guild.members.me.permissions.has('BAN_MEMBERS'))return message.channel.send(`Necesito el permiso para __Banear miembros__.`);
        if(!message.member.permissions.has('ADMINISTRATOR'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(_guild.protection.antitokens.enable == false) {
            _guild.protection.antitokens.enable = true;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antitokens.message1}.` });
        }else{
            if(_guild.protection.verification._type == '--v4')return message.channel.send({ content: `${LANG.commands.protect.antitokens.message2}.` });
            _guild.protection.antitokens.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antitokens.message3}.` });
        }

    },
}
const Discord = require('discord.js-light');
const { fecthUsersDataBase } = require('../../functions');

module.exports = {
    nombre: "ayuda",
    category: "Otros",
    premium: false,
    alias: ['help', 'ayudas'],
    description: "Obtén ayuda en el bot.",
    usage: ['<prefix>comandos'],
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
        let user = await fecthUsersDataBase(client, message.author, false);
        if (!user) return message.reply('Error: Tu documento en la base de datos no está definido.');
        user = { premium: {} };

        let embed = new Discord.MessageEmbed()
            .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
            .setTitle('<a:a_happy:953694657370542190> ¡Bienvenido al menú de ayuda!')
            .setDescription('¿Estás perdido? ¡Estás en el lugar correcto! \n\n<:hypesquad_events:992385931703222303>  `NearSecurity` es un bot creado para proteger los servidores de Discord.\n\n- <a:voted:992415801103614063> Para comenzar, revisa mis comandos usando `' + _guild.configuration.prefix + 'comandos`.\n- <a:verified_developer:992387826572333056>  ¿Tienes dudas? Contacta con nuestro soporte o desarrollador haciendo clic [aquí](https://discord.gg/a7FqNnHk2m).')
            .setFooter('NearSecurity')
            .setImage("https://cdn.discordapp.com/attachments/1277170460924317777/1279309437483614228/ayuda.jpg");

        message.channel.send({ embeds: [embed] }).catch(err => {
            console.error('Error al enviar el embed de ayuda:', err);
            message.channel.send({ content: 'Hubo un problema al enviar el mensaje de ayuda.' });
        });
    }
};
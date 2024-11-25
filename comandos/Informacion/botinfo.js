const Discord = require('discord.js-light');
const { fecthUsersDataBase } = require('../../functions');
const fs = require('fs');
const Guilds = require('../../schemas/guildsSchema');
const Blacklist = require('../../schemas/blacklist'); // Asegúrate de requerir el schema correcto
const ms = require('ms');
const { dataRequired } = require('../../functions');

module.exports = {
    nombre: "bot",
    category: "Otros",
    premium: false,
    alias: ['botinfo', 'bi'],
    description: "Obtén todos los comandos del bot.",
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
        if (!user) return message.reply('Err: Your document on database is not defined.');
        user = { premium: {} };

        // Consulta para contar los maliciosos en la colección 'Blacklist'
        let maliciosos = await Blacklist.countDocuments({});

        const embed1 = new Discord.MessageEmbed()
        .setColor("#FDFDFD")
        .setTitle('Información del bot')
        .setDescription(`<:thread_badge:1278484762415202365> **Información general:**\n\n> Dueño: <@1216532655592439862> (zhypeado#0000)\n> Servidores: ${client.guilds.cache.size}\n> Maliciosos: ${maliciosos}\n\n<:stable_ping:1278539281874292859> **Estado del bot**\nUsá \`${_guild.configuration.prefix}ping\` para ver mi estado.\n\n<:DiscordEarlyBotDeveloper:1277361973754859530> **Código**\n> Librería: \`discord.js-light\`\n> Base de datos: \`MongoDB\` & \`MegaDB\``)
        .setImage("https://cdn.discordapp.com/attachments/1277170460924317777/1279309614520864820/nearsecurity.jpg")
        .setFooter('NearSecurity');

        message.channel.send({ embeds: [embed1] });
    }
};
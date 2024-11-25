const Discord = require('discord.js-light');
const { fecthUsersDataBase } = require('../../functions');

// Importar node-fetch dinámicamente
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    nombre: "mcinfo",
    category: "Juegos",
    premium: false,
    alias: ['minecraftinfo', 'serverinfo'],
    description: "Obtén información sobre un servidor de Minecraft.",
    usage: ['<prefix>mcinfo <dirección>'],
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

        if (args.length < 1) {
            return message.reply('Por favor, proporciona la dirección del servidor de Minecraft.');
        }

        const address = args.join(' ');
        const url = `https://api.mcstatus.io/v2/status/java/${address}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.online) {
                return message.reply('El servidor de Minecraft no está en línea o la dirección es incorrecta.');
            }

            // Extraer información
            let motd = data.motd.clean || 'Desconocido';
            let favicon = data.favicon || "https://cdn.discordapp.com/attachments/1277170460924317777/1279309437483614228/minecraft.jpg";
            let version = data.version.name || 'Desconocida';
            let playersOnline = data.players.online || 'Desconocido';
            let playersMax = data.players.max || 'Desconocido';

            // Crear el embed
            let embed = new Discord.MessageEmbed()
                .setColor("#FDFDFD")
                .setTitle(`Información del servidor de Minecraft`)
                .setDescription(`**Servidor:** ${data.hostname || 'Desconocido'}\n` +
                                `**Estado:** ${data.online ? 'En línea' : 'Fuera de línea'}\n` +
                                `**Jugadores:** ${playersOnline} / ${playersMax}\n` +
                                `**Versión:** ${version}\n` +
                                `**Motd:** ${motd}`)
                .setFooter('NearSecurity')
                .setImage(favicon); // Mostrar el favicon como imagen

            message.channel.send({ embeds: [embed] }).catch(err => {
                console.error('Error al enviar el embed de información del servidor de Minecraft:', err);
                message.channel.send({ content: 'Hubo un problema al enviar la información del servidor.' });
            });
        } catch (err) {
            console.error('Error al obtener información del servidor de Minecraft:', err);
            message.channel.send({ content: 'Hubo un problema al obtener la información del servidor.' });
        }
    }
};
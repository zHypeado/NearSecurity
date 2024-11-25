const Discord = require('discord.js-light');
const { dataRequired, fecthUsersDataBase } = require('../../functions');
const _reportar = new Discord.MessageEmbed().setColor("#FDFDFD");

module.exports = {
    nombre: "reportar",
    category: "Otros",
    premium: false,
    alias: ["report"],
    description: "Reporta a alguien",
    usage: ['<prefix>reportar <userID> <Razón> <Prueba>'],
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

        if (!args[0]) return message.reply('Por favor, proporciona una razón y una prueba para reportar un bug.\n\n' + _guild.configuration.prefix + 'reportar <userID> <Razón> <Prueba>');

        message.channel.send({ content: 'Escribe "enviar" para enviar el reporte o cualquier otro mensaje para cancelar.' });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if (m.content == '') return;
            if (m.author.id == message.author.id) {
                if (`${m.content}`.toLowerCase() == 'enviar') { // Cambia "enviar" según el idioma
                    _reportar.setDescription(args.slice(1).join(' ')).setTitle('Tu reporte ha sido enviado con éxito.');
                    message.reply({ embeds: [_reportar], ephemeral: true });
                    client.channels.cache.get("YOUR-STAFF-LOGS-CHANNEL").send({ embeds: [_reportar.setTitle('Bug Reportado').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL())] });
                    collector.stop();
                } else {
                    message.channel.send({ content: 'Mensaje no reconocido. Cancelando el reporte.' });
                    collector.stop();
                }
            }
        });

        let user = await fecthUsersDataBase(client, message.author);
        if (user && user.achievements.data.bugs >= 2 && !user.achievements.array.includes('Cazador de maliciosos.')) {
            message.channel.send({ content: 'Acabas de obtener un logro, mira tu perfil.' });
            user.achievements.array.push('Cazador de maliciosos.');
            user.save();
        }
    }
}
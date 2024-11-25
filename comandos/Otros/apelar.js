const Discord = require('discord.js-light');
const { dataRequired, fecthUsersDataBase } = require('../../functions');
const _reportar = new Discord.MessageEmbed().setColor("#FDFDFD");

module.exports = {
    nombre: "apelar",
    category: "Otros",
    premium: false,
    alias: ["appeal"],
    description: "Reporta a alguien",
    usage: ['<prefix>apelar <Razón y pruebas>'],
    run: async (client, message, args, _guild) => {
        if (!args[0]) return message.reply('Por favor, proporciona una razón y una prueba para que te removamos de la blacklist.\n\n' + _guild.configuration.prefix + 'apelar <Razón y pruebas>');

        message.channel.send({ content: 'Escribe "enviar" para enviar la apelación.' });
        let collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', async m => {
            if (m.content == '') return;
            if (m.author.id == message.author.id) {
                if (`${m.content}`.toLowerCase() == 'enviar') { // Cambia "enviar" según el idioma
                    _reportar.setDescription(args.slice(1).join(' ')).setTitle('Tu apelación ha sida enviada con éxito.');
                    message.reply({ embeds: [_reportar], ephemeral: true });
                    client.channels.cache.get("YOUR-STAFF-LOGS-CHANNEL").send({ embeds: [_reportar.setTitle('Apelación').setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL()).setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL())] });
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
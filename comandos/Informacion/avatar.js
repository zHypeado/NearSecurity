const Discord = require('discord.js-light');

module.exports = {
    nombre: "avatar",
    category: "Información",
    premium: false,
    alias: [],
    description: "Muestra el avatar de un usuario en diferentes formatos y permite descargarlo.",
    usage: ['<prefix>avatar [@usuario o ID]'],
    run: async (client, message, args, _guild) => {
        
        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });
                
                if (user && user.removedAt == null) {
                    return true;
                }

                return false; 
            } catch (err) {
                console.error('Error buscando en la blacklist:', err);
                return false;
            }
        }

        // Verificar si el usuario está en la blacklist
        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }
        
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        let user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null) || message.author;

        if (!user) {
            return message.reply("No se pudo encontrar al usuario.");
        }

        // Generar URLs del avatar en diferentes formatos
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });
        const avatarFormats = {
            webp: user.displayAvatarURL({ format: 'webp', size: 1024 }),
            png: user.displayAvatarURL({ format: 'png', size: 1024 }),
            jpg: user.displayAvatarURL({ format: 'jpg', size: 1024 })
        };

        const _avatarEmbed = new Discord.MessageEmbed()
            .setColor("#FDFDFD")
            .setTitle(`Avatar de ${user.tag}`)
            .setImage(avatarURL)
            .addField('Formatos de descarga:', `[WEBP](${avatarFormats.webp}) | [PNG](${avatarFormats.png}) | [JPG](${avatarFormats.jpg})`)
            .setFooter('NearSecurity');

        message.reply({ embeds: [_avatarEmbed] });
    }
}
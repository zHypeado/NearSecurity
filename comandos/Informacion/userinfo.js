const Discord = require('discord.js-light');

module.exports = {
    nombre: "userinfo",
    category: "Información",
    premium: false,
    alias: [],
    description: "Muestra información sobre un usuario.",
    usage: ['<prefix>userinfo [@usuario o ID]'],
    run: async (client, message, args, _guild) => {

        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });
                console.log("Resultado de la búsqueda de blacklist:", user); 
                
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
        console.log("¿Está en blacklist?", isBlacklisted); 
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }
        
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        let user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null) || message.author;

        if (!user) {
            return message.reply("No se pudo encontrar al usuario.");
        }

        let member = message.guild ? message.guild.members.cache.get(user.id) : null;

        const _userinfo = new Discord.MessageEmbed()
            .setColor("#FDFDFD")
            .setTitle(`<a:crown_uo:992411806033264742> Información de Usuario: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .addField('Nombre de Usuario', user.tag, true)
            .addField('ID', user.id, true)
            .addField('Estado', member ? (member.presence ? member.presence.status : 'No disponible') : 'Usuario no en el servidor', true)
            .addField('Fecha de Creación', `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`, true);

        if (member) {
            _userinfo.addField('Fecha de Ingreso al Servidor', `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`, true);
        } else {
            _userinfo.addField('Fecha de Ingreso al Servidor', 'No está en el servidor', true);
        }

        _userinfo.setFooter('NearSecurity');

        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setLabel('Avatar')
                    .setStyle('LINK')
                    .setURL(user.displayAvatarURL({ dynamic: true, size: 1024 })),
                new Discord.MessageButton()
                    .setLabel('Roles')
                    .setCustomId('roles')
                    .setStyle('PRIMARY')
                    .setDisabled(!member) // Deshabilitar si no es miembro del servidor
            );

        const filter = i => i.customId === 'roles' && i.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 1000000 });

        collector.on('collect', async i => {
            if (i.customId === 'roles') {
                await i.deferUpdate();
                const roles = member.roles.cache
                    .filter(role => role.id !== message.guild.id)
                    .map(role => role.name)
                    .join(', ') || 'Sin roles';

                await i.followUp({ content: `Roles de ${user.tag}: ${roles}`, ephemeral: true });
            }
        });

        message.reply({ embeds: [_userinfo], components: [row] });
    }
}
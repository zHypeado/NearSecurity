const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const Discord = require('discord.js-light');
const Blacklist = require('../../schemas/blacklist'); 

module.exports = { 
    nombre: 'nuke',
    category: 'Moderación',
    premium: false,
    alias: ["nukechannel"],
    description: 'Elimina todos los mensajes de un canal.',
    usage: ['<prefix>nuke'],
    run: async (client, message, _guild) => {

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

        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        console.log("¿Está en blacklist?", isBlacklisted); 
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }

        if (!message.guild.members.me.permissions.has('MANAGE_CHANNELS')) return message.channel.send(LANG.data.permissionsChannelsMe);
        if (!message.member.permissions.has('MANAGE_CHANNELS')) return message.channel.send(LANG.data.permissionsChannelsU);

        const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('<:Alert:1278748088789504082> ¡Cuidado!')
            .setDescription('Estás a punto de recrear este canal. Si estás seguro de continuar, haz clic en el botón "Confirmar". Si no, haz clic en "Cancelar".')
            .setFooter('Esta acción no se puede deshacer.');
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirmar')
                    .setLabel('Confirmar')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('cancelar')
                    .setLabel('Cancelar')
                    .setStyle('DANGER')
            );
        const confirmMessage = await message.reply({ embeds: [embed], components: [row] });
        const filter = i => i.user.id === message.author.id;
        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'confirmar') {
                message.channel.clone({ parent: message.channel.parentId, position: message.channel.position }).then(nuke => {
                    message.channel.delete();
                    nuke.setPosition(message.channel.position).then(() => {
                        const successEmbed = new MessageEmbed()
                            .setColor('#F0F0F0')
                            .setDescription('<:Checkmark:1278179814339252299> | El canal ha sido nukeado con éxito.')
                            .setImage('https://media1.tenor.com/m/-awrYWaCuvoAAAAd/explosion-explode.gif')
                            .setFooter('Acción completada.');
                        nuke.send({ embeds: [successEmbed] });
                    });
                });
                collector.stop();
            } else if (interaction.customId === 'cancelar') {
                message.channel.send('La acción ha sido cancelada.');
                collector.stop();
            }
        });
        collector.on('end', () => {
            confirmMessage.edit({ content: 'La acción ha expirado o ha sido cancelada.', components: [] });
        });
    },
};

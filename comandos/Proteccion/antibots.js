const Discord = require('discord.js-light');
const { updateDataBase } = require('../../functions');

module.exports = {
	nombre: 'antibots',
	category: 'Protección',
    premium: false,
	alias: [],
	description: 'Evita entrada de bots indeseadas en tu servidor.',
	usage: ['<prefix>antibots'],
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

        if (!message.guild.members.me.permissions.has('BAN_MEMBERS')) return message.channel.send(`Necesito permisos para __Banear miembros__.`);
        if (message.author.id != message.guild.ownerId) return message.reply({ content: `${LANG.data.permissionsOwner}.` });

        if (_guild.protection.antibots.enable == false) {
            _guild.protection.antibots.enable = true;

            const embed = new Discord.MessageEmbed()
                .setColor("#FDFDFD")
                .setDescription(`${LANG.commands.protect.antibots.message1}.`);

            const row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setCustomId('all')
                        .setLabel('Todos')
                        .setStyle('PRIMARY'),
                    new Discord.MessageButton()
                        .setCustomId('only_nv')
                        .setLabel('Solo no verificados')
                        .setStyle('SECONDARY'),
                    new Discord.MessageButton()
                        .setCustomId('only_v')
                        .setLabel('Solo verificados')
                        .setStyle('SECONDARY')
                );

            message.reply({ embeds: [embed], components: [row] });

            const filter = (interaction) => {
                return interaction.user.id === message.author.id;
            };

            const collector = message.channel.createMessageComponentCollector({ filter, time: 1000000 });

            collector.on('collect', async (interaction) => {
                if (!interaction.isButton()) return;

                if (interaction.customId === 'all') {
                    _guild.protection.antibots._type = 'all';
                    await interaction.reply({ content: `${LANG.commands.protect.antibots.message2}.`, ephemeral: true });
                } else if (interaction.customId === 'only_nv') {
                    _guild.protection.antibots._type = 'only_nv';
                    await interaction.reply({ content: `${LANG.commands.protect.antibots.message2}.`, ephemeral: true });
                } else if (interaction.customId === 'only_v') {
                    _guild.protection.antibots._type = 'only_v';
                    await interaction.reply({ content: `${LANG.commands.protect.antibots.message2}.`, ephemeral: true });
                }

                updateDataBase(client, message.guild, _guild, true);
                collector.stop();
            });

            collector.on('end', () => {
                message.channel.send({ content: 'Colector detenido.' });
            });

        } else {
            _guild.protection.antibots.enable = false;
            updateDataBase(client, message.guild, _guild, true);
            message.reply({ content: `${LANG.commands.protect.antibots.message4}.` });
        }
    },
};
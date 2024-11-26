const Discord = require('discord.js-light');

module.exports = {
    nombre: "serverinfo",
    category: "Información",
    premium: false,
    alias: ["si"],
    description: "Muestra información detallada sobre el servidor.",
    usage: ['<prefix>serverinfo'],
    run: async (client, message, args, _guild) => {

        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });
                return user && user.removedAt == null;
            } catch (err) {
                console.error('Error buscando en la blacklist:', err);
                return false;
            }
        }

        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        if (isBlacklisted) {
            return message.reply({ content: 'No puedes usar este comando porque estás en la lista negra.', ephemeral: true });
        }

        let server = message.guild;
        let totalTextChannels = server.channels.cache.filter(c => c.type === 'GUILD_TEXT').size;
        let totalVoiceChannels = server.channels.cache.filter(c => c.type === 'GUILD_VOICE').size;
        let totalNewsChannels = server.channels.cache.filter(c => c.type === 'GUILD_NEWS').size;
        let totalCategoryChannels = server.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').size;
        let totalEmojis = server.emojis.cache.size;
        let serverOwner = await server.fetchOwner();
        let boostLevel = server.premiumTier || 'Ninguno';
        let totalBoosts = server.premiumSubscriptionCount || '0';

        const embed = new Discord.MessageEmbed()
            .setColor("#FDFDFD")
            .setTitle(`${server.name}`)
            .setThumbnail(server.iconURL({ dynamic: true, size: 512 }))
            .addField('<a:a_info:954249339243462696> General', [
                `**Miembros:** ${server.memberCount}`,
                `**Roles:** ${server.roles.cache.size}`,
                `**Creado el:** <t:${Math.floor(server.createdAt.getTime() / 1000)}:F>`,
                `**Región:** ${server.preferredLocale}`,
                `**Nivel de Verificación:** ${server.verificationLevel}`,
                `**Nivel de Boost:** ${boostLevel} (${totalBoosts} Boosts)`,
                `**Propietario:** ${serverOwner.user.tag}`
            ].join('\n'))
            .addField('<:uo_add:1015553154533838879> Canales', [
                `**Texto:** ${totalTextChannels}`,
                `**Voz:** ${totalVoiceChannels}`,
                `**Noticias:** ${totalNewsChannels}`,
                `**Categorías:** ${totalCategoryChannels}`
            ].join('\n'))
            .addField('<:fun:992383624462729246>  Emojis', `${totalEmojis}`)
            .setFooter(`Server ID: ${server.id}`);

        if (server.bannerURL()) {
            embed.setImage(server.bannerURL({ dynamic: true, size: 1024 }));
        }

        const row = new Discord.MessageActionRow();

        // Si el servidor tiene un icono, añade el botón
        if (server.iconURL()) {
            row.addComponents(
                new Discord.MessageButton()
                    .setLabel('Server Icon')
                    .setStyle('LINK')
                    .setURL(server.iconURL({ dynamic: true, size: 1024 }))
            );
        }

        // Botones restantes
        row.addComponents(
            new Discord.MessageButton()
                .setLabel('Roles')
                .setCustomId('roles')
                .setStyle('PRIMARY'),
            new Discord.MessageButton()
                .setLabel('Emojis')
                .setCustomId('emojis')
                .setStyle('PRIMARY')
        );

        const filter = i => (i.customId === 'roles' || i.customId === 'emojis') && i.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 1000000 });

        collector.on('collect', async i => {
            await i.deferUpdate();

            if (i.customId === 'roles') {
                const roles = server.roles.cache
                    .filter(role => role.id !== server.id)
                    .sort((a, b) => b.position - a.position) // Ordenar por jerarquía
                    .map(role => `<@&${role.id}>`) // Mencionar roles
                    .join(', ') || 'Sin roles';

                const rolesEmbed = new Discord.MessageEmbed()
                    .setTitle('<:school1:954251695788011560> Roles del servidor')
                    .setDescription(roles)
                    .setColor('#FDFDFD')
                    .setFooter(`Total de roles: ${server.roles.cache.size - 1}`);

                await i.followUp({ embeds: [rolesEmbed], ephemeral: true });
            } else if (i.customId === 'emojis') {
                const emojis = server.emojis.cache
                    .map(emoji => emoji.toString()) // Convertir los emojis a su representación
                    .join(' ') || 'Sin emojis';

                const emojisEmbed = new Discord.MessageEmbed()
                    .setTitle('<:fun:992383624462729246> Emojis del servidor')
                    .setDescription(emojis)
                    .setColor('#FDFDFD')
                    .setFooter(`Total de emojis: ${totalEmojis}`);

                await i.followUp({ embeds: [emojisEmbed], ephemeral: true });
            }
        });

        message.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};

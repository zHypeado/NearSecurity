const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js-light');

const _sos = new MessageEmbed().setColor("#FFFFFF");
const cooldowns = new Map();

module.exports = {
    nombre: "sos",
    category: "Protección",
    premium: false,
    alias: ["intelligentsos"],
    description: "Haz un pedido de ayuda",
    usage: ['<prefix>sos <message>'],
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
        if(!args[0]) return message.reply(await dataRequired('No especificaste la razón del SOS.\n\n' + _guild.configuration.prefix + 'sos <message>'));

        const now = Date.now();
        const cooldownAmount = 5 * 60 * 1000; // 5 minutos en milisegundos

        if (cooldowns.has(message.author.id)) {
            const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`<:Cooldown:1278484817985404992> Por favor, esperá ${timeLeft.toFixed(1)} segundos antes de usar el comando \`sos\` de nuevo.`);
            }
        }

        cooldowns.set(message.author.id, now);
        setTimeout(() => cooldowns.delete(message.author.id), cooldownAmount);

        // Enviar el mensaje inicial con el botón
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('send_sos')
                    .setLabel('Enviar SOS')
                    .setStyle('PRIMARY')
            );

        await message.channel.send({
            content: 'Estás a punto de enviar ese mensaje a los agentes de NearSecurity (Quiere decir que el personal de la agencia lo leerá).\n\nPara continuar, haz clic en el botón de abajo. Ten en cuenta que el mal uso, puede resultar en un blacklist.',
            components: [row]
        });

        const filter = (interaction) => {
            return interaction.user.id === message.author.id;
        };

        const collector = message.channel.createMessageComponentCollector({ filter, time: 1000000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'send_sos') {
                _sos.setDescription(args.join(' ')).setTitle('<:Checkmark:1278179814339252299> Solicitud enviada');
                await interaction.reply({ embeds: [_sos], ephemeral: true });

                // Obtener la invitación del servidor
                let invite = await message.guild.invites.create(message.channel.id, { maxAge: 0, maxUses: 1 });

                client.channels.cache.get("YOUR-STAFF-LOGS-CHANNEL").send({
                    content: `@everyone ${invite.url}`,
                    embeds: [_sos.setTitle('<:Alert:1278748088789504082> SOS <:Alert:1278748088789504082>')
                        .setAuthor(`${message.author.tag}, ${message.author.id}`, message.author.displayAvatarURL())
                        .setFooter(`${message.guild.name}, ${message.guild.id}`, message.guild.iconURL())
                    ]
                });

                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send({ content: 'Tiempo de espera agotado. No se envió el SOS.' });
            }
        });
    }
};
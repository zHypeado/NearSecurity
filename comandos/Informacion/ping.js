const Guilds = require('../../schemas/guildsSchema');
const ms = require('ms');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js-light');

module.exports = {
    nombre: 'ping',
    category: 'Configuración',
    premium: false,
    alias: [],
    description: 'Muestra la latencia del bot.',
    usage: ['<prefix>ping'],
    run: async (client, message, args, _guild) => {

        const Blacklist = require('../../schemas/blacklist'); 
        async function isUserBlacklisted(client, userId) {
            try {
                const user = await Blacklist.findOne({ userId });
                if (user && user.removedAt == null) {
                    return true; // Usuario en la blacklist
                }
                return false; // Usuario no está en blacklist o fue removido
            } catch (err) {
                console.error('Error buscando en la blacklist:', err);
                return false; // En caso de error
            }
        }

        // Verificar si el usuario está en la blacklist
        const isBlacklisted = await isUserBlacklisted(client, message.author.id);
        if (isBlacklisted) {
            return message.reply('No puedes usar este comando porque estás en la lista negra.');
        }

        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        try {
            // Crear el botón de refrescar
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('refresh_ping')
                        .setLabel('🔄 Reintentar')
                        .setStyle('PRIMARY')
                );

            // Calcular el ping de mensajes, API, DB, y caché
            const calculatePing = async () => {
                // Crear mensaje temporal para calcular latencia de mensajes
                let initialMessage = await message.reply('<:Cooldown:1278484817985404992> ' + LANG.commands.config.ping.message1);
                
                // Latencia de mensajes: tiempo entre que se envió el comando y se respondió
                let msgPing = initialMessage.createdTimestamp - message.createdTimestamp;

                // Latencia de la API de Discord
                let apiPing = client.ws.ping;

                // Latencia de la base de datos
                let dbStart = Date.now();
                await Guilds.findOne({ id: message.guild.id });
                let dbPing = Date.now() - dbStart;

                // Latencia de caché
                let cacheStart = Date.now();
                await client.database.guilds.get(message.guild.id, true);
                let cachePing = Date.now() - cacheStart;

                return { msgPing, apiPing, dbPing, cachePing, initialMessage };
            };

            // Realizar el cálculo inicial
            const { msgPing, apiPing, dbPing, cachePing, initialMessage } = await calculatePing();

            // Crear el embed inicial
            const pingEmbed = new MessageEmbed()
                .setColor('#FFFFFF')
                .setTitle('<a:a_stats:953184308233908265> Ping del Bot')
                .setDescription('Aquí está la latencia actual del bot:')
                .addField('🌐 Latencia de Mensajes', `${msgPing}ms`, true)
                .addField('🤖 Latencia de la API', `${apiPing}ms`, true)
                .addField('📚 Latencia de la DB', `${dbPing}ms`, true)
                .addField('📁 Latencia de Caché', `${cachePing}ms`, true)
                .setFooter('NearSecurity');

            // Editar el mensaje con el embed y el botón
            await initialMessage.edit({ content: null, embeds: [pingEmbed], components: [row] });

            // Crear un collector para el botón de refrescar
            const filter = (interaction) => interaction.customId === 'refresh_ping' && interaction.user.id === message.author.id;
            const collector = initialMessage.createMessageComponentCollector({ filter, time: 1000000 });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'refresh_ping') {
                    // Volver a calcular el ping sin acumular los valores
                    const { msgPing, apiPing, dbPing, cachePing } = await calculatePing();
                    
                    // Actualizar el embed con los nuevos pings
                    const refreshedEmbed = new MessageEmbed()
                        .setColor('#FFFFFF')
                        .setTitle('<a:a_stats:953184308233908265> Ping del Bot')
                        .setDescription('Aquí está la latencia actual del bot:')
                        .addField('🌐 Latencia de Mensajes', `N/A`, true)
                        .addField('🤖 Latencia de la API', `${apiPing}ms`, true)
                        .addField('📚 Latencia de la DB', `${dbPing}ms`, true)
                        .addField('📁 Latencia de Caché', `${cachePing}ms`, true)
                        .setFooter('NearSecurity');

                    await interaction.update({ embeds: [refreshedEmbed] });
                }
            });

            collector.on('end', () => {
                // Deshabilitar el botón después de que termine el collector
                const disabledRow = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('refresh_ping')
                            .setLabel('🔄 Refrescar Ping')
                            .setStyle('PRIMARY')
                            .setDisabled(true)
                    );
                initialMessage.edit({ components: [disabledRow] });
            });
        } catch (err) {
            message.reply('Ocurrió un error al intentar mostrar el ping.');
            console.error(err);
        }
    },
};
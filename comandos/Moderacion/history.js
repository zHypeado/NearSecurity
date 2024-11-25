const Discord = require('discord.js-light');
const Sanction = require('../../schemas/sanctionSchema');

module.exports = {
    nombre: 'history',
    category: 'Moderación',
    premium: false,
    alias: ['historial', 'sanctionhistory'],
    description: 'Muestra el historial de sanciones de un usuario.',
    usage: ['<prefix>historial <userMention|userId>'],
    run: async (client, message, args) => {
        
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
        
        // Obtener el usuario mencionado o por ID
        const userMention = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

        // Verificar si se ha encontrado un miembro válido
        if (!userMention) {
            return message.reply('Por favor menciona un usuario o proporciona un ID válido.');
        }

        // Obtener el historial de sanciones del usuario
        const sanctions = await Sanction.find({ userId: userMention.id });

        // Verificar si hay sanciones
        if (sanctions.length === 0) {
            return message.reply(`No hay sanciones registradas para <@${userMention.id}>.`);
        }

        // Configuración de paginación
        const pageSize = 5; // Número de sanciones por página
        const totalPages = Math.ceil(sanctions.length / pageSize);
        let currentPage = 0;

        // Función para crear el embed de historial
        const createHistoryEmbed = (page) => {
            const historyEmbed = new Discord.MessageEmbed()
                .setTitle(`Historial de Sanciones de ${userMention.id}`)
                .setColor('#FFFFFF') // Color blanco
                .setDescription('A continuación se muestra el historial de sanciones:')
                .setFooter(`Página ${page + 1} de ${totalPages}`);

            // Calcular el índice de inicio y fin para la paginación
            const start = page * pageSize;
            const end = Math.min(start + pageSize, sanctions.length);

            // Añadir cada sanción al embed
            for (let i = start; i < end; i++) {
                const sanction = sanctions[i];
                historyEmbed.addField(`Tipo: ${sanction.sanctionType}`, 
                    `Razón: **${sanction.reason}**\n` +
                    `Moderador: <@${sanction.moderatorId}>\n` +
                    `Fecha: ${new Date(sanction.createdAt).toLocaleDateString()}`, 
                    false);
            }

            return historyEmbed;
        };

        // Enviar el primer embed
        const msg = await message.channel.send({ embeds: [createHistoryEmbed(currentPage)] });

        // Crear menú desplegable para la paginación
        const selectMenu = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('select')
                    .setPlaceholder('Selecciona una página')
                    .addOptions(
                        Array.from({ length: totalPages }, (v, i) => ({
                            label: `Página ${i + 1}`,
                            value: `${i}`
                        }))
                    )
            );

        await msg.edit({ components: [selectMenu] });

        // Crear el collector para el menú desplegable
        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'select') {
                currentPage = parseInt(interaction.values[0]); // Obtener la página seleccionada
                await interaction.update({ embeds: [createHistoryEmbed(currentPage)], components: [selectMenu] });
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] }); // Desactivar el menú al finalizar
        });
    },
};
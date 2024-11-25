const Discord = require('discord.js-light');

module.exports = {
    nombre: 'purge-channels-by-name',
    category: 'Protección',
    premium: false,
    alias: ['purgechannels', 'pcbn'],
    description: 'Borra todos los canales (de texto, de voz y categorías) que tengan el nombre especificado.',
    usage: ['<prefix>purge-channels-by-name <nombreDelCanal>'],
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
        
        // Verificar si el usuario proporcionó un nombre de canal
        if (!args.length) {
            return message.reply('Por favor, especifica el nombre del canal o categoría que deseas eliminar.');
        }

        // Combinar todos los argumentos en un solo string para nombres con espacios
        const channelName = args.join(' ').toLowerCase();

        // Verificar si el usuario es el dueño del servidor
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('Solo el dueño del servidor puede usar este comando.');
        }

        // Verificar si el bot tiene permisos suficientes
        if (!message.guild.members.me.permissions.has('MANAGE_CHANNELS')) {
            return message.reply('Necesito permisos para __Gestionar Canales__ para ejecutar este comando.');
        }

        // Filtrar y eliminar canales y categorías que coincidan con el nombre especificado
        const channelsToDelete = message.guild.channels.cache.filter(channel => 
            (channel.name.toLowerCase() === channelName) && (channel.isText() || channel.isVoice() || channel.isCategory())
        );

        if (channelsToDelete.size === 0) {
            return message.reply(`No se encontraron canales o categorías con el nombre **${channelName}**.`);
        }

        // Eliminar los canales y categorías encontrados
        channelsToDelete.forEach(channel => {
            channel.delete()
                .then(() => console.log(`Canal/Categoría ${channel.name} eliminado correctamente.`))
                .catch(err => console.error(`No se pudo eliminar el canal/categoría ${channel.name}:`, err));
        });

        message.reply(`Eliminando ${channelsToDelete.size} canal(es) o categoría(s) con el nombre **${channelName}**, si se vuelven a crear, utiliza **n!antichannels** para desactivar el sistema.`);
    },
};
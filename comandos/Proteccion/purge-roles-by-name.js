const Discord = require('discord.js-light');

module.exports = {
    nombre: 'purge-roles-by-name',
    category: 'Protección',
    premium: false,
    alias: ['purgeroles', 'prbn'],
    description: 'Borra todos los roles que tengan el nombre especificado.',
    usage: ['<prefix>purge-roles-by-name <nombreDelRol>'],
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
        
        // Verificar si el usuario proporcionó un nombre de rol
        if (!args.length) {
            return message.reply('Por favor, especifica el nombre del rol que deseas eliminar.');
        }

        // Combinar todos los argumentos en un solo string para nombres con espacios
        const roleName = args.join(' ').toLowerCase();

        // Verificar si el usuario es el dueño del servidor
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('Solo el dueño del servidor puede usar este comando.');
        }

        // Verificar si el bot tiene permisos suficientes
        if (!message.guild.members.me.permissions.has('MANAGE_ROLES')) {
            return message.reply('Necesito permisos para __Gestionar Roles__ para ejecutar este comando.');
        }

        // Filtrar y eliminar roles que coincidan con el nombre especificado
        const rolesToDelete = message.guild.roles.cache.filter(role => 
            role.name.toLowerCase() === roleName && role.id !== message.guild.id // No eliminar el rol @everyone
        );

        if (rolesToDelete.size === 0) {
            return message.reply(`No se encontraron roles con el nombre **${roleName}**.`);
        }

        // Eliminar los roles encontrados
        rolesToDelete.forEach(role => {
            role.delete()
                .then(() => console.log(`Rol ${role.name} eliminado correctamente.`))
                .catch(err => console.error(`No se pudo eliminar el rol ${role.name}:`, err));
        });

        message.reply(`Eliminando ${rolesToDelete.size} rol(es) con el nombre **${roleName}**.`);
    },
};
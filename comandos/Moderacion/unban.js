const Discord = require('discord.js-light');
const { dataRequired, updateDataBase } = require('../../functions');
const Sanction = require('../../schemas/sanctionSchema'); // Asegúrate de que este schema exista

module.exports = {
    nombre: 'unban',
    category: 'Moderación',
    premium: false,
    alias: ['desbanear'],
    description: 'Desbanea a un usuario de tu servidor.',
    usage: ['<prefix>unban <userId>'],
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
        
        // Verificar permisos del bot
        if (!message.guild.members.me.permissions.has('BAN_MEMBERS'))
            return message.channel.send('⚠️ No tengo permisos para desbanear miembros en este servidor.');

        // Verificar permisos del miembro que ejecuta el comando
        if (!message.member.permissions.has('BAN_MEMBERS'))
            return message.channel.send('⚠️ No tienes permisos para desbanear miembros en este servidor.');

        // Verificar que se haya proporcionado un ID de usuario
        if (!args[0])
            return message.reply(await dataRequired('⚠️ Debes proporcionar el ID del usuario que deseas desbanear.\n\nEjemplo: !unban <userId>'));

        let userID = client.users.cache.get(args[0]);
        if (!userID) return message.reply('❌ Error 005: No se puede obtener este usuario.');

        try {
            // Desbanear al usuario
            await message.guild.members.unban(args[0]);

            // Registrar la sanción en la base de datos
            const newSanction = new Sanction({
                guildId: message.guild.id,
                userId: userID.id,
                sanctionType: 'UNBAN', // Tipo de sanción: Desbanear
                moderatorId: message.author.id, // ID del moderador que ejecutó el comando
                reason: 'El usuario ha sido desbaneado sin razón especificada.' // Puedes cambiar el texto según sea necesario
            });
            await newSanction.save();

            // Confirmar al usuario que fue desbaneado
            message.reply({ content: `✅ El usuario \`${userID.tag}\` ha sido desbaneado correctamente.` });
        } catch (err) {
            // Informar en caso de error
            message.reply({ content: '❌ Ocurrió un error al intentar desbanear al usuario. ¿Está baneado?' });
            console.error('Error al desbanear al usuario:', err);
        }
    },
};
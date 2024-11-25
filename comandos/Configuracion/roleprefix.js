const Discord = require('discord.js-light');
const RolePrefix = require('../../schemas/roleprefix'); // Ruta del esquema de roleprefix

module.exports = {
    nombre: "roleprefix",
    category: "Administración",
    premium: false,
    alias: [],
    description: "Configura o elimina el prefijo para un rol.",
    usage: ['<prefix>roleprefix set/remove @rol [prefijo]'],
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
        
        if (!message.member.permissions.has('MANAGE_GUILD')) {
            return message.reply('No tienes permisos suficientes para usar este comando.');
        }

        const action = args[0];
        const role = message.mentions.roles.first();
        const prefix = args[2];

        if (!role) {
            return message.reply('Debes mencionar un rol.');
        }

        if (action === 'set') {
            if (!prefix) {
                return message.reply('Debes proporcionar un prefijo.');
            }

            try {
                const guildPrefix = await RolePrefix.findOne({ guildId: message.guild.id });

                if (!guildPrefix) {
                    await RolePrefix.create({
                        guildId: message.guild.id,
                        prefixes: { [role.id]: prefix }
                    });
                } else {
                    guildPrefix.prefixes.set(role.id, prefix);
                    await guildPrefix.save();
                }

                message.reply(`Prefijo "${prefix}" configurado para el rol ${role}. Nombres de usuarios con rol ${role} actualizados.`);

                role.members.forEach(member => {
                    const newName = `${prefix} ${member.user.username}`;
                    member.setNickname(newName).catch(err => console.error(err));
                });
            } catch (error) {
                console.error('Error al configurar el prefijo:', error);
                message.reply('Hubo un error al intentar configurar el prefijo.');
            }
        } else if (action === 'remove') {
            try {
                const guildPrefix = await RolePrefix.findOne({ guildId: message.guild.id });

                if (!guildPrefix || !guildPrefix.prefixes.has(role.id)) {
                    return message.reply('No se encontró un prefijo configurado para este rol.');
                }

                guildPrefix.prefixes.delete(role.id);
                await guildPrefix.save();

                message.reply(`Prefijo eliminado para el rol ${role}.`);

                role.members.forEach(member => {
                    const newName = member.user.username; // Restaurar el nombre original
                    member.setNickname(newName).catch(err => console.error(err));
                });
            } catch (error) {
                console.error('Error al eliminar el prefijo:', error);
                message.reply('Hubo un error al intentar eliminar el prefijo.');
            }
        } else {
            message.reply('Acción no reconocida. Usa `set` para configurar un prefijo o `remove` para eliminarlo.');
        }
    }
};
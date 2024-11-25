const { MessageEmbed } = require('discord.js');
const Blacklist = require('../../schemas/blacklist'); // Ruta del modelo de blacklist

module.exports = {
    nombre: 'blacklist',
    category: 'Moderación',
    premium: false,
    alias: ['bl'],
    description: 'Gestiona la lista negra de usuarios.',
    usage: ['<prefix>blacklist <add|remove|info> <userId> [reason] [proof]'],
    run: async (client, message, args) => {
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Verifica si el usuario tiene el rol necesario en el servidor especificado
        const allowedGuild = client.guilds.cache.get(allowedGuildId);
        if (!allowedGuild) {
            return message.channel.send('<:Crossmark:1278179784433864795> | El servidor especificado no se encuentra disponible.');
        }

        const member = allowedGuild.members.cache.get(message.author.id);
        const hasRequiredRole = member && member.roles.cache.has(requiredRoleId);

        if (!hasRequiredRole) {
            return message.channel.send('<:Crossmark:1278179784433864795> | No tienes el rol necesario para usar este comando.');
        }

        const action = args[0];
        const userId = args[1];
        const reason = args.slice(2, -1).join(' ');
        const proof = args[args.length - 1];
        const staffId = message.author.id; // ID del staff que realiza la acción

        if (!action || !['add', 'remove', 'info'].includes(action)) {
            return message.channel.send('<:Crossmark:1278179784433864795> | Uso incorrecto. Usa `add`, `remove` o `info` como primer argumento.');
        }

        if (!userId) {
            return message.channel.send('<:Crossmark:1278179784433864795> | Debes proporcionar un `userId`.');
        }

        if (action === 'add') {
            if (!reason || !proof) {
                return message.channel.send('<:Crossmark:1278179784433864795> | Para añadir a la lista negra, debes proporcionar `reason` y `proof`.');
            }

            try {
                const newEntry = new Blacklist({
                    userId,
                    reason,
                    proof,
                    staffId // Guardamos el ID del staff que añade al usuario
                });
                await newEntry.save();
                message.channel.send(`<:Checkmark:1278179814339252299> | Usuario con ID \`${userId}\` añadido a la lista negra.`);
            } catch (error) {
                console.error(error);
                message.channel.send('<:Alert:1278748088789504082> | Error al añadir al usuario a la lista negra.');
            }

        } else if (action === 'remove') {
            if (!reason || !proof) {
                return message.channel.send('<:Crossmark:1278179784433864795> | Para remover de la lista negra, debes proporcionar `reason` y `proof`.');
            }

            try {
                // Eliminar la entrada de la colección
                const result = await Blacklist.deleteOne({ userId }); // Elimina el documento correspondiente
                if (result.deletedCount > 0) {
                    message.channel.send(`<:Checkmark:1278179814339252299> Usuario con ID \`${userId}\` removido de la lista negra.`);
                } else {
                    message.channel.send('<:Crossmark:1278179784433864795> | No se encontró al usuario en la lista negra.');
                }
            } catch (error) {
                console.error(error);
                message.channel.send('<:Alert:1278748088789504082> | Error al remover al usuario de la lista negra.');
            }

        } else if (action === 'info') {
            try {
                const entry = await Blacklist.findOne({ userId }); // Solo buscar la entrada sin verificar eliminado
                if (entry) {
                    const embed = new MessageEmbed()
                        .setColor("#FDFDFD")
                        .setTitle('Información del Usuario en Lista Negra')
                        .addFields(
                            { name: 'ID del Usuario', value: entry.userId, inline: true },
                            { name: 'Razón', value: entry.reason, inline: true },
                            { name: 'Prueba', value: entry.proof, inline: true },
                            { name: 'Añadido el', value: new Date(entry.addedAt).toLocaleDateString(), inline: true },
                            { name: 'Añadido por', value: `<@${entry.staffId}>`, inline: true } // Muestra al staff que añadió al usuario
                        )
                        .setFooter({ text: 'NearSecurity' });

                    message.channel.send({ embeds: [embed] });
                } else {
                    message.channel.send('<:Crossmark:1278179784433864795> | No se encontró información para este usuario en la lista negra.');
                }
            } catch (error) {
                console.error(error);
                message.channel.send('<:Alert:1278748088789504082> | Error al obtener la información del usuario.');
            }
        }
    }
};
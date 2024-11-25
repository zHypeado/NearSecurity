const Discord = require('discord.js-light');
const Sanction = require('../../schemas/sanctionSchema');
const { dataRequired } = require('../../functions');

module.exports = {
    nombre: 'hackban',
    category: 'Moderación',
    premium: false,
    alias: ['banid'],
    description: 'Banea a un usuario que no esté dentro de tu gremio.',
    usage: ['<prefix>hackban <userId>'],
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
        
        if (!message.guild.members.me.permissions.has('BAN_MEMBERS')) {
            return message.channel.send('Necesito permiso de __Banear Miembros__.');
        }
        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.channel.send('Necesitas permisos de __Banear Miembros__.');
        }
        if (!args[0]) {
            return message.reply(await dataRequired('No has escrito la id de la persona.\n\n' + _guild.configuration.prefix + 'hackban <userId>'));
        }
        if (isNaN(args[0])) {
            return message.channel.send('Eso no era una id.');
        }

        try {
            let miembro;
            miembro = await client.users.cache.get(args[0]);
            if (!miembro) {
                miembro = await client.users.fetch(args[0]);
            }

            // Enviar mensaje al usuario baneado
            miembro.send(`Has sido baneado de \`${message.guild.name}\`.`).catch(err => {});

            // Bannear al usuario
            await message.guild.members.ban(miembro.id);

            // Guardar la sanción en la base de datos
            const newSanction = new Sanction({
                userId: miembro.id,
                guildId: message.guild.id,
                moderatorId: message.author.id,
                sanctionType: 'hackban', // O el tipo que prefieras
                reason: 'Baneo realizado mediante hackban' // Puedes ajustar esta razón según lo que prefieras
            });
            await newSanction.save();

            message.reply(`\`${miembro.tag}\` ha sido baneado de este servidor.`);
        } catch (e) {
            message.channel.send('```' + e + '```');
        }
    },
};
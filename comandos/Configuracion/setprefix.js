const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: "setprefix",
    category: "Configuración",
    premium: false,
    alias: ['prefix', 'editprefix', 'newprefix', 'changeprefix'],
    description: "Cambia el prefijo del bot.",
    usage: ['<prefix>setprefix <newPrefix>'],
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

        if(!message.member.permissions.has('ADMINISTRATOR'))return message.reply({ content: LANG.data.permissionsADMIN });
        if(!args[0])return message.reply(await dataRequired("No has especificado el nuevo prefijo.\n\n" + _guild.configuration.prefix + "setprefix <newPrefix>"));
        if(args[0].length > 3)return message.reply("¡Ese prefijo es muy largo!");
        _guild.configuration.prefix = args[0];
        updateDataBase(client, message.guild, _guild, true);
        message.reply({ content: `> Prefijo actualizado a \`${args[0]}\`` });
        client.channels.cache.get("YOUR-STAFF-LOGS-CHANNEL").send("Prefix actualizado a `<prefix>` en **<guildName>** (<guildId>)".replace('<prefix>', args[0]).replace('<guildName>', message.guild.name).replace('<guildId>', message.guild.id));
    }
}
const Discord = require('discord.js-light');
const Guild = require('../../schemas/guildsSchema');

module.exports = {
    nombre: 'status',
    category: 'Protección',
    premium: false,
    alias: ['estado'],
    description: 'Muestra el estado de los sistemas de protección.',
    usage: ['<prefix>status'],
    run: async (client, message) => {
        
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
        
        const checkmark = "<:Checkmark:1278179814339252299>";
        const crossmark = "<:Crossmark:1278179784433864795>";

        // Obtener datos del servidor desde MongoDB
        const guildData = await Guild.findOne({ id: message.guild.id });
        if (!guildData || !guildData.protection) {
            return message.reply("No se pudo obtener el estado de protección. Los datos no están disponibles.");
        }

        // Verificar si cada propiedad dentro de guildData.protection está definida
        const systems = {
            'Antibots': guildData.protection.antibots && guildData.protection.antibots.enable,
            'Antiflood': guildData.protection.antiflood,
            'Antijoins': guildData.protection.antijoins && guildData.protection.antijoins.enable,
            'Antiraid': guildData.protection.antiraid && guildData.protection.antiraid.enable,
            'Antitokens': guildData.protection.antitokens && guildData.protection.antitokens.enable,
            'Bloq-entrities-by-name': guildData.protection.bloqEntritiesByName && guildData.protection.bloqEntritiesByName.enable,
            'Bloq-new-created-users': guildData.protection.bloqNewCreatedUsers,
            'Cannot-enter-twice': guildData.protection.cannotEnterTwice && guildData.protection.cannotEnterTwice.enable,
            'Intelligent-antiflood': guildData.protection.intelligentAntiflood,
            'Ownsystem': guildData.protection.ownSystem && guildData.protection.ownSystem.enable,
            'Raidmode': guildData.protection.raidmode && guildData.protection.raidmode.enable,
            'Antiwebhook': guildData.protection.purgeWebhooksAttacks && guildData.protection.purgeWebhooksAttacks.enable,
            'Verification': guildData.protection.verification && guildData.protection.verification.enable,
            'Antichannels': guildData.protection.antichannels && guildData.protection.antichannels.enable, // Agregado antichannels
            'Logs': guildData.configuration && guildData.configuration.logs && guildData.configuration.logs.length > 0,
        };

        const embed = new Discord.MessageEmbed()
            .setColor("#FDFDFD")
            .setTitle("Estado de los sistemas de protección");

        for (const [key, value] of Object.entries(systems)) {
            if (key === 'Verification' && value) {
                embed.addField(key, `${checkmark} Canal: <#${guildData.protection.verification.channel}>`, true);
            } else if (key === 'Logs' && value) {
                embed.addField(key, `${checkmark} Canal: <#${guildData.configuration.logs[0]}>`, true);
            } else {
                embed.addField(key, value ? checkmark : crossmark, true);
            }
        }

        embed.setFooter('NearSecurity');

        message.reply({ embeds: [embed] });
    }
};
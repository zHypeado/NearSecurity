const Discord = require('discord.js-light');
const { fecthUsersDataBase } = require('../../functions');
const fs = require('fs');
const path = require('path');

// Función para obtener los nombres de los comandos desde los archivos JavaScript en una carpeta
function getCommandNames(folderPath) {
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    return commandFiles.map(file => path.basename(file, '.js'));
}

// Rutas de las carpetas de comandos
const informacionCommands = getCommandNames('/home/container/comandos/Informacion');
const protectionCommands = getCommandNames('/home/container/comandos/Proteccion');
const moderationCommands = getCommandNames('/home/container/comandos/Moderacion');
const configurationCommands = getCommandNames('/home/container/comandos/Configuracion');
const otherCommands = getCommandNames('/home/container/comandos/Otros');
const staffCommands = getCommandNames('/home/container/comandos/Staff');

module.exports = {
    nombre: "comandos",
    category: "Otros",
    premium: false,
    alias: ['commands', 'cmds'],
    description: "Obtén todos los comandos del bot.",
    usage: ['<prefix>comandos'],
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
        let user = await fecthUsersDataBase(client, message.author, false);
        if (!user) return message.reply('Err: Your document on database is not defined.');
        user = { premium: {} };

        // IDs de rol y servidor de staff
        const requiredRoleId = 'YOUR-STAFF-ROLE'; // ID del rol requerido
        const allowedGuildId = 'YOUR-STAFF-SERVER'; // ID del servidor donde se encuentra el rol

        // Verificar si el usuario tiene el rol de staff en el servidor permitido
        const member = client.guilds.cache.get(allowedGuildId)?.members.cache.get(message.author.id);
        const hasStaffRole = member && member.roles.cache.has(requiredRoleId);

        const embedWelcome = new Discord.MessageEmbed()
            .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
            .setDescription(`¡Hola! Utiliza el menú de debajo para elegir la categoría del comando.\n\n❓ ¿Dudas? Utiliza ${_guild.configuration.prefix}biblioteca para obtener información de algún comando\n\n**Anuncios**\n> <a:a_check:953184898125025290> ¡Buscamos la verificación! Ayúdanos a mejorar y verificar.\n> <a:discord_Discord_Partner_disc:992385380865294386> ¿Quieres ser Partner? Únete a nuestro soporte y habla con soporte.`)
            .setImage("https://cdn.discordapp.com/attachments/1277170460924317777/1279309180469248081/comandos.jpg")
            .setFooter("NearSecurity");

        const embedCategory = (category) => {
            switch (category) {
                case 'Protección':
                    return new Discord.MessageEmbed()
                        .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
                        .setDescription(`${LANG.commands.others.comandos.message1} \`${_guild.configuration.prefix}biblioteca\`, ${LANG.commands.others.comandos.message2} \`${_guild.configuration.prefix}invite\`.`)
                        .addField(`<:windows_security:1277361559114481715> | Protección:`, `\`${protectionCommands.join('`, `')}\``)
                        .setFooter("NearSecurity");
                case 'Moderación':
                    return new Discord.MessageEmbed()
                        .setColor("#FDFDFD")
                        .setDescription(`${LANG.commands.others.comandos.message1} \`${_guild.configuration.prefix}biblioteca\`, ${LANG.commands.others.comandos.message2} \`${_guild.configuration.prefix}invite\`.`)
                        .addField(`<:Moderator:1277361994600808549> | Moderación:`, `\`${moderationCommands.join('`, `')}\``)
                        .setFooter("NearSecurity");
                case 'Información':
                    return new Discord.MessageEmbed()
                        .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
                        .setDescription(`${LANG.commands.others.comandos.message1} \`${_guild.configuration.prefix}biblioteca\`, ${LANG.commands.others.comandos.message2} \`${_guild.configuration.prefix}invite\`.`)
                        .addField(`<:Info:1280303272472875021> | Información:`, `\`${informacionCommands.join('`, `')}\``)
                        .setFooter("NearSecurity");
                case 'Configuración':
                    return new Discord.MessageEmbed()
                        .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
                        .setDescription(`${LANG.commands.others.comandos.message1} \`${_guild.configuration.prefix}biblioteca\`, ${LANG.commands.others.comandos.message2} \`${_guild.configuration.prefix}invite\`.`)
                        .addField(`<:DiscordEarlyBotDeveloper:1277361973754859530> | Configuración:`, `\`${configurationCommands.join('`, `')}\``)
                        .setFooter("NearSecurity");
                case 'Tickets':
                    return new Discord.MessageEmbed()
                        .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
                        .setDescription(`<:blue_ticket:1012017313878388816> Los tickets están disponibles en nuestro bot **[NearTickets](https://discord.com/oauth2/authorize?client_id=1297682443251351593&permissions=8&integration_type=0&scope=bot)**.`)
                        .setFooter("NearSecurity");
                case 'Otros':
                    return new Discord.MessageEmbed()
                        .setColor(user.premium.isActive ? "#FDFDFD" : "#FDFDFD")
                        .setDescription(`${LANG.commands.others.comandos.message1} \`${_guild.configuration.prefix}biblioteca\`, ${LANG.commands.others.comandos.message2} \`${_guild.configuration.prefix}invite\`.`)
                        .addField(`<:legacyusernamebadge:1277361951076388875> | Otros:`, `\`${otherCommands.join('`, `')}\``)
                        .setFooter("NearSecurity");
                case 'Staff':
                    return new Discord.MessageEmbed()
                        .setColor('#FFD700') // Color dorado para staff
                        .setDescription(`Comandos exclusivos del staff:`)
                        .addField(`🛠️ | Staff:`, `\`${staffCommands.join('`, `')}\``)
                        .setFooter("NearSecurity");
                default:
                    return embedWelcome;
            }
        };

        // Crear las categorías principales y añadir la de "Staff" si el usuario tiene el rol correspondiente
        const categories = ['Protección', 'Moderación', 'Información', 'Configuración', 'Tickets', 'Otros'];
        if (hasStaffRole) categories.push('Staff');

        const options = categories.map(cat => ({
            label: cat,
            value: cat.toLowerCase(),
            description: `Ver comandos de ${cat}`
        }));

        const selectMenu = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('categorySelect')
                    .setPlaceholder('Selecciona una categoría')
                    .addOptions(options)
            );

        const msg = await message.channel.send({ embeds: [embedWelcome], components: [selectMenu] });

        const filter = i => i.customId === 'categorySelect' && i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 1000000 });

        collector.on('collect', async i => {
            const selectedCategory = i.values[0];
            const newEmbed = embedCategory(categories.find(cat => cat.toLowerCase() === selectedCategory));
            await i.update({ embeds: [newEmbed] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.edit({ components: [] }); // Eliminar el menú desplegable después de que expire el tiempo
            }
        });
    }
};
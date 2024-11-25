const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    nombre: "invite",
    category: "Otros",
    premium: false,
    alias: ['inv'],
    description: "Invítame a tu servidor.",
    usage: ['<prefix>invite'],
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

        // Crear embed con texto formal
        const inviteEmbed = new MessageEmbed()
            .setColor('#FFFFFF')
            .setTitle('<a:matches:992411238644584488> ¡Invítame a tu servidor!')
            .setDescription('Gracias por considerar invitarme a tu servidor. Estoy aquí para mejorar la gestión de tu comunidad con funciones útiles y automatizaciones seguras. Haz click en los botones para invitarme o ver nuestra web.')
            .setFooter('NearSecurity');

        // Crear botones
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Invitame')
                    .setStyle('LINK')
                    .setURL('https://discord.com/oauth2/authorize?client_id=1277124708369961021&permissions=8&integration_type=0&scope=bot+applications.commands'),
                new MessageButton()
                    .setLabel('Página web')
                    .setStyle('LINK')
                    .setURL('https://www.kwikxdev.com')
            );

        // Enviar el mensaje con el embed y los botones
        await message.reply({ embeds: [inviteEmbed], components: [row], ephemeral: true });
    }
}
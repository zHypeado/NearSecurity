const Discord = require('discord.js-light');
const { dataRequired, updateDataBase } = require('../../functions');

module.exports = {
    nombre: 'verification',
    category: 'Protección',
    premium: false,
    alias: ['verify', 'setverify', 'verificacion', 'verificación'],
    description: 'Activa un sistema para evitar selfbots de forma segura.',
    usage: ['<prefix>verification'],
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
        
        if (!message.guild.members.me.permissions.has('MANAGE_ROLES')) {
            return message.channel.send('Necesito permiso de __Administrar roles__.');
        }

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send('Necesitas permiso de __Administrador__.');
        }

        if (_guild.protection.verification.enable) {
            // Desactivar el sistema de verificación
            _guild.protection.verification.enable = false;

            if (_guild.protection.verification._type === '--v4') {
                _guild.protection.antitokens.enable = false;
                message.channel.send('Se activó el antitokens para que la verificación de tipo 4 funcione, lo he desactivado.');
            }

            updateDataBase(client, message.guild, _guild, true);
            return message.reply('Verificación automática desactivada.');
        }

        // Activar el sistema de verificación
        _guild.protection.verification.enable = true;

        message.channel.send({
            embeds: [
                new Discord.MessageEmbed()
                    .setColor("#FDFDFD")
                    .setDescription('Estoy activando el sistema de verificación, mientras tanto dime el tipo de verificación que deseas establecer:')
                    .addField('Verificación tipo 1:', '`Una verificación manual, escribiendo el comando "' + _guild.configuration.prefix + 'verify <userMention>".`\n\n**Activar con:**\n--v1 <channelMention> <roleMention>\n**Ejemplo:**\n--v1 <#' + message.guild.channels.cache.filter(x => x.type === 'GUILD_TEXT').random().id + '> <@&' + message.guild.roles.cache.random().id + '>')
                    .addField('Verificación tipo 2:', '`Una verificación recolectando mensajes. Cuando se detecte una entrada de un usuario en el servidor, NearSecurity enviará un código que el usuario deberá repetir.`\n\n**Activar con:**\n--v2 <channelMention> <roleMention>\n**Ejemplo:**\n--v2 <#' + message.guild.channels.cache.filter(x => x.type === 'GUILD_TEXT').random().id + '> <@&' + message.guild.roles.cache.random().id + '>')
                    .addField('Verificación tipo 3:', '`Verificación con botones. Cuando un usuario entre en el servidor deberá pulsar un botón en el canal mencionado para que se le agregue el rol de verificado.`\n\n**Activar con:**\n--v3 <channelMention> <roleMention> [buttonContent] /split/ [messageContent]\n**Ejemplo:**\n--v3 <#' + message.guild.channels.cache.filter(x => x.type === 'GUILD_TEXT').random().id + '> <@&' + message.guild.roles.cache.random().id + '> Verificar. /split/ ¡Haz click en el botón de abajo para verificarte!')
                    .addField('Verificación tipo 4:', '`Una verificación completamente automática que se basará en el sistema antitokens. Si el bot no detecta ningún problema, se le agregará el rol de usuario verificado.`\n\n**Activar con:**\n--v4 <roleMention>\n**Ejemplo:**\n--v4 <@&' + message.guild.roles.cache.random().id + '>')
            ]
        });

        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async m => {
            if (m.content.trim() === '') return;

            const args = m.content.split(' ');
            const verificationType = args[0];
            const channelMention = m.mentions.channels.first();
            const roleMention = m.mentions.roles.first();

            if (!['--v1', '--v2', '--v3', '--v4'].includes(verificationType)) {
                message.reply('No has escrito el tipo de verificación.');
                collector.stop();
                return;
            }

            if (verificationType !== '--v4' && !channelMention) {
                message.reply(await dataRequired('Necesitas mencionar un canal.\n\n' + verificationType + ' <channelMention> <roleMention>'));
                collector.stop();
                return;
            }

            // Verificar que el canal mencionado está en el servidor
            if (verificationType !== '--v4' && !message.guild.channels.cache.has(channelMention.id)) {
                message.reply(await dataRequired('¡El canal mencionado debe estar en este servidor!\n\n' + verificationType + ' <channelMention> <roleMention>'));
                collector.stop();
                return;
            }

            if (!roleMention) {
                message.reply(await dataRequired('Debes mencionar el rol que deseas establecer como rol de verificación.\n\n' + verificationType + ' <channelMention> <roleMention>'));
                collector.stop();
                return;
            }

            if (message.member.roles.highest.position <= roleMention.position) {
                message.reply('Ese rol está más alto que tu rol o tiene la misma posición.');
                collector.stop();
                return;
            }

            if (!message.guild.roles.cache.has(roleMention.id)) {
                message.reply('Este servidor no tiene ningún rol con esa ID.');
                collector.stop();
                return;
            }

            _guild.protection.verification._type = verificationType;
            _guild.protection.verification.role = roleMention.id;

            if (verificationType !== '--v4') {
                _guild.protection.verification.channel = channelMention.id;
            }

            if (verificationType === '--v1') {
                message.channel.send('Sistema activado, ahora puedes verificar miembros con `' + _guild.configuration.prefix + 'verify <userMention>`');
            } else if (verificationType === '--v2') {
                message.channel.send('Sistema activado, ahora cuando se una un usuario enviaré en el canal de verificación un código como este: `aB.1f.k0`.');
            } else if (verificationType === '--v3') {
                let buttonContent = 'No soy un robot.';
                let messageContent = '¡Bienvenido! Debes presionar el botón adjunto para ver los demás canales y demostrar que no eres un robot con orejas de gato.';
                const splitIndex = m.content.indexOf(' /split/ ');

                if (splitIndex !== -1) {
                    const parts = m.content.split(' /split/ ');
                    buttonContent = parts[0].split(`${roleMention.id}> `)[1];
                    messageContent = parts[1];
                } else if (m.content.includes(`${roleMention.id}> `)) {
                    buttonContent = m.content.split(`${roleMention.id}> `)[1];
                }

                client.channels.cache.get(channelMention.id).send({
                    embeds: [new Discord.MessageEmbed().setColor("#FDFDFD").setDescription(messageContent)],
                    components: [new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('verifyButton').setLabel(buttonContent).setStyle('PRIMARY'))]
                });
                message.channel.send('Sistema activado, ya he enviado el botón en el canal de verificación.');
            } else if (verificationType === '--v4') {
                if (!_guild.protection.antitokens.enable) {
                    _guild.protection.antitokens.enable = true;
                    message.channel.send('He activado el sistema antitokens, debe estar así para que la verificación funcione.');
                }
                message.channel.send('Sistema activado, ahora verificaré miembros basándome en el sistema antitokens.');
            }

            collector.stop();
            updateDataBase(client, message.guild, _guild, true);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send('No se recibió ninguna respuesta en el tiempo permitido.');
            }
        });
    },
};
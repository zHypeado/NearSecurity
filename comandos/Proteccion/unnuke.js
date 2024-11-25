const { dataRequired } = require("../../functions");
const ms = require('ms');
const cooldown = new Map();

module.exports = {
	nombre: 'unnuke',
	category: 'Configuración',
    premium: false,
	alias: [],
	description: 'Un destructor automático de canales raideados.',
	usage: ['<prefix>unnuke {channels, roles, emojis, bans}'],
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

        if(!message.guild.members.me.permissions.has('MANAGE_CHANNELS'))return message.channel.send(`Necesito el permiso de __Administrar canales__.`);
        if(!message.member.permissions.has('MANAGE_CHANNELS'))return message.channel.send(`${LANG.data.permissionsADMIN}.`);

        if(cooldown.has(message.author.id)) {
            let c = await cooldown.get(message.author.id);
            if(c > Date.now())return message.channel.send(LANG.commands.config.unnuke.message1);
            cooldown.delete(message.author.id);
        }

        let contador = 1;
    
        if(args[0] == 'channels') {
            cooldown.set(message.author.id, Date.now() + ms('1s'));
            message.reply(LANG.commands.config.unnuke.message2);
            let _channels = [];
            message.guild.channels.cache.forEach(x => {
                if(_channels.includes(x.name)) {
                    message.guild.channels.cache.forEach(i => {
                        try{
                            if(i.name == x.name) {
                                contador++;
                                setTimeout(() => {
                                    i.delete().catch(err => {});
                                }, 2000 * contador);
                            }
                        }catch(e) {}
                    });
                }else{
                    _channels.push(x.name);
                }
            });
        }else if(args[0] == 'roles') {
            cooldown.set(message.author.id, Date.now() + ms('1s'));
            message.reply(LANG.commands.config.unnuke.message2);
            let _roles = [];
            message.guild.roles.cache.forEach(x => {
                contador++;
                if(_roles.includes(x.name)) {
                    message.guild.roles.cache.forEach(i => {
                        try{
                            if(i.name == x.name) {
                                setTimeout(() => {
                                    i.delete().catch(err => {});
                                }, 2000 * contador);
                            }
                        }catch(e) {}
                    });
                }else{
                    _roles.push(x.name);
                }
            });
        }else if(args[0] == 'emojis') {
            cooldown.set(message.author.id, Date.now() + ms('1s'));
            message.reply(LANG.commands.config.unnuke.message2);
            let _emojis = [];
            message.guild.emojis.cache.forEach(x => {
                contador++;
                if(_emojis.includes(x.name)) {
                    message.guild.emojis.cache.forEach(i => {
                        try{
                            if(i.name == x.name) {
                                setTimeout(() => {
                                    i.delete().catch(err => {});
                                }, 2000 * contador);
                            }
                        }catch(e) {}
                    });
                }else{
                    _emojis.push(x.name);
                }
            });
        }else if(args[0] == 'bans') {
            cooldown.set(message.author.id, Date.now() + ms('1s'));
            message.reply(LANG.commands.config.unnuke.message2);
            let arr = await message.guild.bans.fetch();
    
            arr.forEach(x => {
                contador++;
                setTimeout(() => {
                    message.guild.members.members.unban(x.user.id).catch(err => {});
                }, 2000 * contador);
            });
        }else{
            message.reply(await dataRequired(`${LANG.commands.config.unnuke.message3}\n\n${_guild.configuration.prefix}unnuke {channels, roles, emojis, bans}`));
        }
	},
};
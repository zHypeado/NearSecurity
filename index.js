//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.
// estuve 20 años pidiendole a la IA q haga comentarios, más vale q lo entiendas

const fs = require('fs');
const { package, version } = require('./package.json');
const Discord = require('discord.js-light');
const client = new Discord.Client({
    shards: 'auto',
    makeCache: Discord.Options.cacheWithLimits({
        ApplicationCommandManager: 0,
        BaseGuildEmojiManager: 0,
        ChannelManager: Infinity, 
        GuildChannelManager: Infinity, 
        GuildBanManager: Infinity, 
        GuildInviteManager: 0, 
        GuildManager: Infinity, 
        GuildMemberManager: Infinity, 
        GuildStickerManager: 0,
        GuildScheduledEventManager: 0,
        MessageManager: Infinity, 
        PermissionOverwriteManager: Infinity, 
        PresenceManager: 0, 
        ReactionManager: 0, 
        ReactionUserManager: 0, 
        RoleManager: Infinity, 
        StageInstanceManager: 0, 
        ThreadManager: 0, 
        ThreadMemberManager: 0,
        UserManager: Infinity, 
        VoiceStateManager: 0 
    }),
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        "GUILD_MESSAGES",
        "GUILD_MEMBERS",
        "GUILD_BANS",
        "GUILDS",
        "GUILD_EMOJIS_AND_STICKERS",
        "GUILD_INVITES",
        "GUILD_WEBHOOKS",
        "GUILD_INTEGRATIONS",
        "GUILD_VOICE_STATES",
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_TYPING",
        "GUILD_MESSAGE_TYPING",
        "GUILD_SCHEDULED_EVENTS"
    ],
    partials: ['CHANNEL', 'GUILD_MEMBER', 'GUILD_SCHEDULED_EVENT', 'MESSAGE', 'REACTION', 'USER']
});

const colors = {
    success: "\x1b[32m",
    info: "\x1b[34m",
    reset: "\x1b[0m"
};

const mongoose = require('mongoose');
mongoose.connect("YOUR-MONGO-DB-HERE", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(`${colors.success}[SUCCESS]${colors.reset} Conectado a mongoose.`);
}).catch(err => console.log(err));

const { cacheManager, cacheManagerDatabase } = require('./cacheManager');
client.super = {
    cache: new cacheManager('utils'), 
    staff: new cacheManager('staff'), 
    languages: new cacheManager('languages') 
};

client.database = {
    guilds: new cacheManager('guilds', {}, false), 
    users: new cacheManagerDatabase(client, 'u') 
};

client.login("YOUR-TOKEN-HERE").then(async () => {
    Discord.client = client;
    console.clear();
    console.log(`${colors.info}██████████████████████████████████████████████████████████████████████████`);
    console.log(`${colors.info}█▄─▀█▄─▄█▄─▄▄─██▀▄─██▄─▄▄▀█─▄▄▄▄█▄─▄▄─█─▄▄▄─█▄─██─▄█▄─▄▄▀█▄─▄█─▄─▄─█▄─█─▄█`);
    console.log(`${colors.info}██─█▄▀─███─▄█▀██─▀─███─▄─▄█▄▄▄▄─██─▄█▀█─███▀██─██─███─▄─▄██─████─████▄─▄██`);
    console.log(`${colors.info}▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀▄▄▀▄▄▀▄▄▀▄▄▀▄▄▄▄▄▀▄▄▄▄▄▀▄▄▄▄▄▀▀▄▄▄▄▀▀▄▄▀▄▄▀▄▄▄▀▀▄▄▄▀▀▀▄▄▄▀▀`);
    console.log(`${colors.info}[INFO]${colors.reset} Bot logged in as ${client.user.tag} (${client.user.id})`);
    console.log(`${colors.info}[INFO]${colors.reset} Bot is active in ${client.guilds.cache.size} guilds.`);
    console.log(`${colors.info}[INFO]${colors.reset} Bot is now online! Version ${version}.`);

    client.comandos = new Discord.Collection();

    for (const file of fs.readdirSync('./eventos/')) {
        if (file.endsWith('.js')) {
            let fileName = file.substring(0, file.length - 3);
            let fileContents = require(`./eventos/${file}`);
            client.on(fileName, fileContents.bind(null, client));
            delete require.cache[require.resolve(`./eventos/${file}`)];
        }
    }
    console.log(`${colors.success}[SUCCESS]${colors.reset} Loaded events`);

    for (const subcarpeta of fs.readdirSync('./comandos/')) {
        for (const file of fs.readdirSync('./comandos/' + subcarpeta)) {
            if (file.endsWith(".js")) {
                let fileName = file.substring(0, file.length - 3);
                let fileContents = require(`./comandos/${subcarpeta}/${file}`);
                client.comandos.set(fileName, fileContents);
            }
        }
    }
    console.log(`${colors.success}[SUCCESS]${colors.reset} Loaded prefix commands`);

    for (const file of fs.readdirSync('./LANG/')) {
        if (file.endsWith('.json')) {
            let fileName = file.substring(0, file.length - 5);
            let fileContents = require(`./LANG/${file}`);
            client.super.languages.set(fileName, fileContents);
        }
    }
    console.log(`${colors.success}[SUCCESS]${colors.reset} Loaded langs`);

});

setTimeout(() => {
    console.log(`${colors.info}[INFO]${colors.reset} Bot created by zHypeado | NearSecurity © All rights reserved`);
}, 2000);

process.on('unhandledRejection', (err) => {
    console.error(`${colors.info}[INFO]${colors.reset} Unhandled Rejection:`, err);
});

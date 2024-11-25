//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const guildsSchema = new mongoose.Schema({
    // SERVER ID
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },

    protection: {
        antiraid: {
            enable: { type: Boolean, default: false },
            amount: { type: Number, default: 0 },
            saveBotsEntrities: {
                authorOfEntry: { type: String, default: '' },
                _bot: { type: String, default: '' }
            }
        },
        antibots: {
            enable: { type: Boolean, default: false },
            _type: { type: String, default: '' }
        },
        antitokens: {
            enable: { type: Boolean, default: false },
            usersEntrities: { type: [String], default: [] },
            entritiesCount: { type: Number, default: 0 }
        },
        antijoins: {
            enable: { type: Boolean, default: false },
            rememberEntrities: { type: [String], default: [] }
        },
        markMalicious: {
            enable: { type: Boolean, default: false },
            _type: { type: String, default: '' },
            rememberEntrities: { type: [String], default: [] }
        },
        warnEntry: { type: Boolean, default: false },
        kickMalicious: {
            enable: { type: Boolean, default: false },
            rememberEntrities: { type: [String], default: [] }
        },
        ownSystem: {
            enable: { type: Boolean, default: false },
            events: {
                messageCreate: { type: [String], default: [] },
                messageDelete: { type: [String], default: [] },
                messageUpdate: { type: [String], default: [] },
                channelCreate: { type: [String], default: [] },
                channelDelete: { type: [String], default: [] },
                channelUpdate: { type: [String], default: [] },
                roleCreate: { type: [String], default: [] },
                roleDelete: { type: [String], default: [] },
                roleUpdate: { type: [String], default: [] },
                emojiCreate: { type: [String], default: [] },
                emojiDelete: { type: [String], default: [] },
                emojiUpdate: { type: [String], default: [] },
                stickerCreate: { type: [String], default: [] },
                stickerDelete: { type: [String], default: [] },
                stickerUpdate: { type: [String], default: [] },
                guildMemberAdd: { type: [String], default: [] },
                guildMemberRemove: { type: [String], default: [] },
                guildMemberUpdate: { type: [String], default: [] },
                guildBanAdd: { type: [String], default: [] },
                guildBanRemove: { type: [String], default: [] },
                inviteCreate: { type: [String], default: [] },
                inviteDelete: { type: [String], default: [] },
                threadCreate: { type: [String], default: [] },
                threadDelete: { type: [String], default: [] }
            }
        },
        verification: {
            enable: { type: Boolean, default: false },
            _type: { type: String, default: '' },
            channel: { type: String, default: '' },
            role: { type: String, default: '' }
        },
        cannotEnterTwice: {
            enable: { type: Boolean, default: false },
            users: { type: [String], default: [] }
        },
        purgeWebhooksAttacks: {
            enable: { type: Boolean, default: false },
            amount: { type: Number, default: 5 },
            rememberOwners: { type: String, default: '' }
        },
        intelligentSOS: {
            enable: { type: Boolean, default: false },
            cooldown: { type: Boolean, default: false }
        },
        intelligentAntiflood: { type: Boolean, default: false },
        antiflood: { type: Boolean, default: false },
        bloqEntritiesByName: {
            enable: { type: Boolean, default: false },
            names: { type: [String], default: [] }
        },
        bloqNewCreatedUsers: {
            time: { type: String, default: '' }
        },
        raidmode: {
            enable: { type: Boolean, default: false },
            timeToDisable: { type: String, default: '' },
            password: { type: String, default: '' },
            activedDate: { type: Number, default: 0 }
        },
        antiwebhook: {
            enable: { type: Boolean, default: false },
            maxWebhooks: { type: Number, default: 5 }
        },
        antichannels: { // Nueva propiedad para el sistema antichannels
            enable: { type: Boolean, default: false }
        }
    },

    moderation: {
        dataModeration: {
            muterole: { type: String, default: '' },
            forceReasons: { type: [String], default: [] },
            timers: { type: [String], default: [] },
            badwords: { type: [String], default: [] },
            events: {
                manyPings: { type: Boolean, default: false },
                capitalLetters: { type: Boolean, default: false },
                manyEmojis: { type: Boolean, default: false },
                manyWords: { type: Boolean, default: false },
                linkDetect: { type: Boolean, default: false },
                ghostping: { type: Boolean, default: false },
                nsfwFilter: { type: Boolean, default: false },
                iploggerFilter: { type: Boolean, default: false }
            }
        },
        automoderator: {
            enable: { type: Boolean, default: false },
            actions: {
                warns: { type: [String], default: [] },
                muteTime: { type: [String], default: [] },
                action: { type: String, default: '' },
                linksToIgnore: { type: [String], default: [] },
                floodDetect: { type: Number, default: 0 },
                manyEmojis: { type: Number, default: 0 },
                manyPings: { type: Number, default: 0 },
                manyWords: { type: Number, default: 0 }
            },
            events: {
                badwordDetect: { type: Boolean, default: false },
                floodDetect: { type: Boolean, default: false },
                manyPings: { type: Boolean, default: false },
                capitalLetters: { type: Boolean, default: false },
                manyEmojis: { type: Boolean, default: false },
                manyWords: { type: Boolean, default: false },
                linkDetect: { type: Boolean, default: false },
                ghostping: { type: Boolean, default: false },
                nsfwFilter: { type: Boolean, default: false },
                iploggerFilter: { type: Boolean, default: false }
            }
        }
    },

    configuration: {
        _version: { type: String, default: '' },
        prefix: { type: String, default: '' },
        whitelist: { type: [String], default: [] },
        logs: { type: [String], default: [] },
        language: { type: String, default: '' },
        ignoreChannels: { type: [String], default: [] },
        password: {
            enable: { type: Boolean, default: false },
            _password: { type: String, default: '' },
            usersWithAcces: { type: [String], default: [] }
        },
        subData: {
            showDetailsInCmdsCommand: { type: String, default: '' },
            pingMessage: { type: String, default: '' },
            dontRepeatTheAutomoderatorAction: { type: Boolean, default: false }
        }
    },
});

module.exports = mongoose.model('nearsecurity_Guild', guildsSchema);
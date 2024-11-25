//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const rolePrefixSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefixes: {
        type: Map,
        of: String,
        default: {}
    }
});

module.exports = mongoose.model('RolePrefix', rolePrefixSchema);

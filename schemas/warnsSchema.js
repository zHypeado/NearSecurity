//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const warnsSchema = new mongoose.Schema({
    guildId: mongoose.SchemaTypes.String,
    userId: mongoose.SchemaTypes.String,
    warns: mongoose.SchemaTypes.Array,
    subCount: mongoose.SchemaTypes.Number
});

module.exports = mongoose.model('nearsecurity_Warns', warnsSchema);
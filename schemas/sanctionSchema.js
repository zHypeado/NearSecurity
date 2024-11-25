//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const sanctionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    sanctionType: { type: String, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sanction', sanctionSchema);
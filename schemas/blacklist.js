//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    reason: { type: String, required: true },
    proof: { type: String, required: true },
    staffId: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
    removedAt: { type: Date },
    removalReason: { type: String },
    removalProof: { type: String }, 
    removalStaffId: { type: String }
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
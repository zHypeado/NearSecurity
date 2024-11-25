//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const timersSchema = new mongoose.Schema({
    servers: mongoose.SchemaTypes.Array,
    partners: mongoose.SchemaTypes.Array,
    serversBloqued: mongoose.SchemaTypes.Array,
    maliciousQueue: mongoose.SchemaTypes.Array,
    staff: mongoose.SchemaTypes.Array,
    panels: {
        web: mongoose.SchemaTypes.Array,
        nuclearSafety: mongoose.SchemaTypes.Array,
        nearsecurity: mongoose.SchemaTypes.Array,
    }
});

module.exports = mongoose.model('nearsecurity_Timers', timersSchema);
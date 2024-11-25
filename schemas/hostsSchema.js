//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const hostsSchema = new mongoose.Schema({
    // Estos datos pertenecen a RZ (ORG). Debemos mantener su privacidad.
});

module.exports = mongoose.model('nearsecurity_Hosts', hostsSchema);
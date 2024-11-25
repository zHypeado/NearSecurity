//NEARSECURITY DISCORD BOT
//CÓDIGO ORIGINAL DE https://github.com/devEthan6737/SPAgency
//TODOS LOS CREDITOS A ETHER Y THE INDIE BRAND.

const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    fetchAutor: mongoose.SchemaTypes.String,
    fetchStaff: mongoose.SchemaTypes.String,
    staff: {
        id: mongoose.SchemaTypes.String,
        tag: mongoose.SchemaTypes.String
    },
    author: {
        id: mongoose.SchemaTypes.String,
        tag: mongoose.SchemaTypes.String
    }
});

module.exports = mongoose.model('nearsecurity_Support', supportSchema);
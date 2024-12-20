const mongoose = require ('mongoose');
const Schema = mongoose.Schema;

const anketSchema = new Schema ({
    soru: {type:String, required:true},
    cevap: {type: [String], required:true}
    
},{timestamps:true});

module.exports = mongoose.model('Anket',anketSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  okul_no: { type: String, required: true }, // Kullanıcı okul numarası
  soru: { type: String, required: true }, // Soru metni
  feedback: { type: String, required: true }, // Geri bildirim (örneğin "çok iyi", "orta" gibi)
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

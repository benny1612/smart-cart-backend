const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  barcode: String,
  // מפת מחירים: המפתח הוא ה-ID של הסניף, הערך הוא המחיר האחרון
  prices: {
    type: Map,
    of: Number,
    default: {}
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
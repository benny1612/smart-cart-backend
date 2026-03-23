const mongoose = require('mongoose');

const ShoppingListSchema = new mongoose.Schema({
  name: { type: String, default: "הרשימה שלי" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // שותפי עריכה
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 }
    }
  ],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ShoppingList || mongoose.model('ShoppingList', ShoppingListSchema);
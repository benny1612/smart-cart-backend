const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true }, // למשל: "קניון איילון"
  chain: { type: String, required: true }, // למשל: "שופרסל"
  location: String
});

module.exports = mongoose.model('Branch', branchSchema);
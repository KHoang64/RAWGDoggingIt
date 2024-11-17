const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  released: String,
  rating: Number,
  platforms: [String],
});

module.exports = mongoose.model('Game', GameSchema);

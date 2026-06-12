const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  
  foodRating: { type: Number, min: 1, max: 5, required: true },
  serviceRating: { type: Number, min: 1, max: 5, required: true },
  cleanlinessRating: { type: Number, min: 1, max: 5, required: true },
  
  comments: { type: String, default: '' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);

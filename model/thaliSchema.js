const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Thali Schema
const thaliSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  items: [
    {
      foodItemId: {
        type: Schema.Types.ObjectId,
        ref: 'FoodItem',  // References FoodItems collection
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      }
    }
  ],
  totalPrice: {
    type: Number,
    required: false,
  },
  category: {
    type: String,
    enum: ['Punjabi', 'Gujarati', 'South Indian', 'Chinese', 'Continental','Indian'],
    required: true,
  },
  isJain: {
    type: Boolean,
    required: true,
  },
  minimumQuantity: {
    type: Number,
    default: 1,  // Optional, if you want to enforce a minimum quantity per item
  },
  minimumPrice: {
    type: Number,
    default: 0,  // Optional, if you want to enforce a minimum price condition
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // References Users collection
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Thali', thaliSchema);

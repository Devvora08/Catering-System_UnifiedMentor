const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Appetizer', 'Soup', 'Main Course', 'Side Dish', 'Dessert'],
    required: true,
  },
  isJain: {
    type: Boolean,
    required: true,
  },
  price: { type: Number, required: true },
  cuisineType: {
    type: String,
    enum: ['Indian', 'Gujarati', 'South Indian', 'Chinese', 'Punjabi', 'Continental'],
    default: 'Indian', 
    required: true,
  }
}, { timestamps: true });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
module.exports = FoodItem;

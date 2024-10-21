const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: [String],  
    default: [],
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  orderHistory: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Order',
    default: [], 
  },
  isTiffinSubscriber: {
    type: Boolean,
    default: false,
  },
  specialPreferences: {
    type: String,
    default: null, 
  },
  bill: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: ['user','admin','team'],
    default: 'user',
    required: true,
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;

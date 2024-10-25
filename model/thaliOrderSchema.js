const mongoose = require('mongoose');

const thaliOrderSchema = new mongoose.Schema({
    quantity: { 
        type: Number, 
        required: true, 
        min: 20,
    },
    thaliId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Thali', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    total: {
        type:Number,
        required:true,
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    isTiffin: { 
        type: Boolean, 
        default: false 
    },
    duration: {
        type: Number,
        required: false}
});

// Create the ThaliOrder model
const ThaliOrder = mongoose.model('ThaliOrder', thaliOrderSchema);

module.exports = ThaliOrder;

const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    discount: {
        type: Number,
        required: true,
    },
    orderType: {
        type: String,
        enum: ['thali', 'tiffin', 'regular'],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Create the Offers model
const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    senderRole: { type: String, enum: ['admin', 'team'], required: true }, // 'admin' or 'team'
    recipientRole: { type: String, enum: ['team'], default: 'team' }, // messages are intended for the 'team'
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
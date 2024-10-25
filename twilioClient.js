const twilio = require('twilio');

const accountSid = 'ACaa03c42e2f72451cbd5eef71e3c08fd4'; // Replace with your Account SID
const authToken = 'cb4c96fff2ff2124004f5247be2f6200'; // Replace with your Auth Token

const client = new twilio(accountSid, authToken);

function sendSMS(to, confirmationMessage) {
    return client.messages.create({
        body: confirmationMessage,
        from: '+17064683313', // Your new Twilio phone number
        to: to, // User's phone number
    });
}

module.exports = { sendSMS };



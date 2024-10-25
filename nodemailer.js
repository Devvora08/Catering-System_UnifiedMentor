const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'marveldev060@gmail.com', // Replace with your email
        pass: 'hqwmnavusduzbozh',  // Replace with your generated App Password
    },
    debug: true,
});

function sendOrderConfirmationEmail(to, subject, text) {
    const mailOptions = {
        from: "marveldev060@gmail.com",  // Sender email
        to: to, // User's email address
        subject: subject,
        text: text, // Body of the email
    };

    return transporter.sendMail(mailOptions)
        .then(info => {
            console.log('Email sent successfully:', info.response);
        })
        .catch(error => {
            console.error('Error sending email:', error);
        });
}

module.exports = { sendOrderConfirmationEmail };

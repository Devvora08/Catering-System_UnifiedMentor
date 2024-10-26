const Message = require("../model/messageSchema");

async function getTeamHome(req,res){
    res.render('team/teamHome');
}

async function seeMessages(req, res) {
    try {
        // Find all messages intended for team members
        const messages = await Message.find({ recipientRole: 'team' })
            .select('content createdAt senderRole') // Select only relevant fields
            .sort({ createdAt: -1 }) // Optional: sort by most recent first
            .exec();

        res.render("team/message", { messages }); // Pass messages to the EJS view
    } catch (error) {
        console.error("Error retrieving messages:", error);
        res.status(500).send("Server Error"); // Handle the error appropriately
    }
}


module.exports = {getTeamHome,seeMessages};
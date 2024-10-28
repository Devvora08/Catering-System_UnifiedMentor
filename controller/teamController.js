const Order = require("../model/orderSchema");
const ThaliOrder = require("../model/thaliOrderSchema");
const User = require("../model/userSchema")
const Message = require("../model/messageSchema");
const Offer = require("../model/offerSchema");

async function getTeamHome(req, res) {
    try {
        // Fetch the latest simple order
        const lastSimpleOrder = await Order.findOne().sort({ createdAt: -1 });

        // Fetch the latest thali and tiffin orders (if needed)
        const lastThaliOrder = await ThaliOrder.findOne({ isTiffin: false }).sort({ createdAt: -1 });
        const lastTiffinOrder = await ThaliOrder.findOne({ isTiffin: true }).sort({ createdAt: -1 });

        const randomUsers = await User.aggregate([
            { $match: { role: 'user' } },  // Match users with role 'user'
            { $sample: { size: 10 } },     // Randomly select 10 users
            { $project: { name: 1 } }       // Only fetch the user's name for simplicity
        ]);

        // Define an array of random descriptions
        const descriptions = [
            "Excellent service and prompt delivery!",
            "Really enjoyed the food quality and taste.",
            "Great value for money.",
            "Quick response and delicious food.",
            "Very satisfied with the catering service.",
            "Loved the thali variety and freshness.",
            "Tiffin service is timely and tasty.",
            "Highly recommend for events.",
            "Authentic flavors and good portions.",
            "Wonderful experience and courteous staff."
        ];

        // Randomly assign order types to each user
        const orderTypes = ["Thali", "Tiffin"];
        const customerFeedback = randomUsers.map((user, index) => ({
            name: user.name,
            orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],  // Randomly select an order type
            description: descriptions[index % descriptions.length]  // Use a description for each user
        }));

        // Fetch the last admin notification
        const lastAdminNotification = await Message.findOne().sort({ createdAt: -1 });

        // Fetch all team members' info
        const teamMembers = await User.find({ role: 'team' });

        // Render the team home page with fetched data
        res.render('team/teamHome', {
            lastSimpleOrder,
            lastThaliOrder,
            lastTiffinOrder,
            customerFeedback,
            lastAdminNotification,
            teamMembers
        });
    } catch (error) {
        console.error("Error fetching team home data:", error);
        res.status(500).send("Server error. Please try again.");
    }
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
async function createOffer(req, res) {
    try {
        const { discount, orderType, startDate, endDate } = req.body;

        // Create a new offer object
        const newOffer = new Offer({
            discount,
            orderType,
            startDate,
            endDate
        });

        // Save the offer to the database
        await newOffer.save();

        // Optionally, redirect to the offers page or send a success message
        res.redirect('/team/home'); // Adjust the redirect path as needed
    } catch (error) {
        console.error("Error creating offer:", error);
        res.status(500).send("Server error. Please try again.");
    }
}
module.exports = {getTeamHome,seeMessages,createOffer};
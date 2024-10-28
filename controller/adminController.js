const Order = require("../model/orderSchema");
const ThaliOrder = require("../model/thaliOrderSchema");
const User = require("../model/userSchema")
const Message = require("../model/messageSchema");

async function getHome(req, res) {
    try {
        // 1. Stats
        const lastOrder = await Order.findOne().sort({ createdAt: -1 });
        const userCount = await User.countDocuments();
        const newUser = await User.findOne({role:"user"}).sort({ createdAt: -1 });
        const admins = await User.find({ role: 'admin' }); // Assuming 'admin' as role identifier for admins
        const teamMembers = await User.find({ role: 'team' }); 
        // 2. Special Preferences
        const specialPreferences = await Order.find({ specialInstructions: { $exists: true, $ne: null } });
        
        // 3. Tiffin Subscribers
        const tiffinOrders = await ThaliOrder.find({ isTiffin: true }).populate('userId', 'name email phone'); // Assuming userId references the User model
        const tiffinSubscribers = tiffinOrders.map(order => ({
            thaliId: order.thaliId, // Assuming thaliId is needed for display
            name: order.userId.name,
            email: order.userId.email,
            phone: order.userId.phone,
            createdAt: order.createdAt, // Ensure startDate is in the ThaliOrder schema
            quantity: order.quantity,    // Ensure this field exists in your ThaliOrder schema
            total: order.total           // Ensure this field exists in your ThaliOrder schema
        }));

        // 4. Notifications
        const latestNotification = await Message.findOne().sort({ createdAt: -1 });

        // Render data to EJS
        res.render("admin/adminHome", {
            lastOrder,
            userCount,
            newUser,
            specialPreferences,
            tiffinSubscribers,
            latestNotification,admins,teamMembers
        });
    } catch (error) {
        console.error("Error fetching admin home data:", error);
        res.status(500).send("Server Error");
    }
}

async function manageOrder(req, res) {
    try {
        const orders = await Order.find({})
            .populate('items.foodItem', 'name') // Populate only the 'name' field of FoodItem
            .populate('user', 'name email') // Populate user to get their name and email
            .exec();

        res.render("admin/manageorder", { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Server Error");
    }
}
async function deletePending(req, res) {
    const orderId = req.params.id;
    try {
       
        await Order.findByIdAndDelete(orderId); 
        res.redirect('/admin/ordermanage');
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).send("Server Error");
    }
}

async function thaliOrder(req, res) {
    try {
        // Fetch thali orders that are not tiffin subscriptions
        const thaliOrdersWithoutTiffin = await ThaliOrder.find({ isTiffin: false })
            .populate('thaliId', 'name') // Populate thali details, adjust fields as necessary
            .populate('userId', 'name email') // Populate user details
            .exec();

        // Fetch all tiffin subscription orders
        const tiffinOrders = await ThaliOrder.find({ isTiffin: true })
            .populate('thaliId', 'name') // Populate thali details, adjust fields as necessary
            .populate('userId', 'name email') // Populate user details
            .exec();

        // Render the view with the fetched data
        res.render("admin/thaliOrders", {
            thaliOrdersWithoutTiffin,
            tiffinOrders
        });
    } catch (error) {
        console.error("Error fetching thali orders:", error);
        res.status(500).send("Internal Server Error");
    }
}

async function userBills(req, res) {
    try {
        const users = await User.find({});

        const userBills = await Promise.all(users.map(async (user) => {
            const orderTotal = await Order.aggregate([
                { $match: { user: user._id } },
                { $group: { _id: null, total: { $sum: "$totalBill" } } }
            ]);

            const thaliOrderTotal = await ThaliOrder.aggregate([
                { $match: { userId: user._id } },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ]);

            const totalBill = (orderTotal[0]?.total || 0) + (thaliOrderTotal[0]?.total || 0);

            return {
                user,
                orderTotal: orderTotal[0]?.total || 0,
                thaliOrderTotal: thaliOrderTotal[0]?.total || 0,
                totalBill
            };
        }));

        res.render("admin/bills", { userBills });
    } catch (error) {
        console.error("Error fetching user bills:", error);
        res.status(500).send("Error loading bills");
    }
}

async function getMessage(req,res){
    res.render("admin/message");
}
async function postMessage(req, res) {
    try {
        // Extract message details from the request body
        const { content, senderRole, recipientRole } = req.body;

        // Create a new message entry
        const newMessage = new Message({
            content: content,
            senderRole: senderRole,
            recipientRole: recipientRole
        });

        // Save the message to the database
        await newMessage.save();

        // Redirect back to the messages page or display a success message
        res.redirect('/admin/message');
    } catch (error) {
        console.error('Error posting message:', error);
        res.status(500).send('Failed to send message. Please try again.');
    }
}

async function seeMessages(req, res) {
    try {
        const messages = await Message.find({ senderRole: 'admin' }).sort({ createdAt: -1 }).lean();
        res.render("admin/seeMessage", { messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Error fetching messages");
    }
}
async function viewTeam(req, res) {
    try {
        // Fetch all users with the role 'team'
        const teamMembers = await User.find({ role: 'team' }).select('name email phone'); // Selecting only relevant fields
        res.render("admin/team", { teamMembers });
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).send("Internal Server Error");
    }
}
module.exports = {getHome,manageOrder,deletePending,thaliOrder,userBills,getMessage,postMessage,seeMessages,viewTeam}
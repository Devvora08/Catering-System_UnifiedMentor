const FoodItem = require('../model/foodItemsSchema');
const User = require('../model/userSchema');
const Order = require("../model/orderSchema");

const jwt = require('jsonwebtoken');

function getHome(req,res){
    res.render('users/userHome');
}
async function getOrder(req, res) {
    const category = req.query.category || 'Appetizer'; // Default to 'Appetizer'
    const foodItems = await FoodItem.find({ category }); // Fetch items based on category
    res.render('users/order', { foodItems, category });
};
async function postOrder(req, res) {
    const category = req.query.category || 'Appetizer';
    const { itemId, quantity, specialInstructions } = req.body;

    // Get the user ID from the token
    const token = req.cookies.uid;
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    let userId;

    try {
        const decoded = jwt.verify(token, "devvora1532@"); // Ensure this matches your signing secret
        userId = decoded._id; // Use _id from the payload
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ message: 'Unauthorized', error: err.message });
    }

    // Find the food item
    const foodItem = await FoodItem.findById(itemId);
    if (!foodItem) {
        return res.status(404).json({ message: 'Food item not found' });
    }

    // Find the user to get the delivery address
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Create or update the order for the user
    const order = await Order.findOne({ user: userId });

    const itemTotal = foodItem.price * quantity; // Calculate total for this item

    if (order) {
        // If order exists, update the order items
        const existingItemIndex = order.items.findIndex(item => item.foodItem.toString() === itemId);

        if (existingItemIndex > -1) {
            // Update quantity if item already exists in order
            order.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            // Add new food item to order
            order.items.push({ foodItem: itemId, quantity: parseInt(quantity), specialInstructions: specialInstructions || '' });
        }

        // Update the total bill
        order.totalBill += itemTotal;

        await order.save();
    } else {
        // Create a new order if none exists
        const newOrder = new Order({
            user: userId,
            items: [{ foodItem: itemId, quantity: parseInt(quantity), specialInstructions: specialInstructions || '' }],
            totalBill: itemTotal, // Set initial total bill
            deliveryAddress: user.address, // Use user's address
            status: 'pending', // Set initial status
            createdAt: new Date(),
        });

        await newOrder.save();
    }
    res.redirect(`/user/order?category=${category}`);
}



async function getProfile(req,res){
    res.render('users/profile');
}
async function getCart(req,res){
    res.render('users/cart');
}
async function getOrderHistory(req,res){
    res.render('users/orderhistory');
}

module.exports = {getHome,getOrder,postOrder,getProfile,getOrderHistory,getCart};
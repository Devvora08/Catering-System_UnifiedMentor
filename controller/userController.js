const FoodItem = require('../model/foodItemsSchema');
const User = require('../model/userSchema');
const Order = require("../model/orderSchema");
const mongoose = require('mongoose'); // Make sure you have this at the top of your file

const jwt = require('jsonwebtoken');

function getHome(req, res) {
    res.render('users/userHome');
}
async function displayCategory(req,res){
    const categoryId = req.params.id;
    let foodItems;

    try {
        if (categoryId === 'jain') {
            // Get all Jain items
            foodItems = await FoodItem.find({ isJain: true });
        } else if (categoryId === 'continental') {
            // Get all Continental items
            foodItems = await FoodItem.find({ cuisineType: 'Continental' });
        } else if (['gujarati', 'southindian', 'chinese', 'punjabi'].includes(categoryId)) {
            // Get specific cuisine items plus Indian cuisine
            foodItems = await FoodItem.find({
                $or: [
                    { cuisineType: categoryId },
                    { cuisineType: 'Indian' }
                ]
            });
        } else if (categoryId === 'indian') {
            // Get all Indian items except Continental
            foodItems = await FoodItem.find({
                cuisineType: { $ne: 'Continental' }
            });
        } else {
            return res.status(404).send('Category not found');
        }

        // Render the page with the retrieved food items
        res.render('users/categoryDisplay', { foodItems, categoryId });
    } catch (error) {
        console.error('Error retrieving food items:', error);
        res.status(500).send('Server Error');
    }
}

async function categoryCart(req,res){
    const userId = req.user._id;
    const { itemId, quantity,categoryId } = req.body;
    const person = await User.findById(userId);
    try {
        // Check for a pending order, if none exists, create a new one
        let order = await Order.findOne({ user: userId, status: 'pending' });

        if (!order) {
            // If no pending order, create a new one
            order = new Order({
                user: userId,
                items: [],
                totalBill: 0,
                status: 'pending',
                specialInstructions: 'None',
                deliveryAddress: person.address,
            });
        }

        // Check if the item is already in the order
        const existingItem = order.items.find(item => item.foodItem.equals(itemId));
        if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += parseInt(quantity);
        } else {
            // Add new item to order
            order.items.push({ foodItem: itemId, quantity: parseInt(quantity) });
        }

        // Recalculate total bill
        order.totalBill = await calculateTotalBill(order.items);

        // Save the updated/new order
        await order.save();

        res.redirect(`/user/displaycategory/${categoryId}`); // Use the variable categoryId here
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

async function getOrder(req, res) {
    const category = req.query.category || 'Appetizer'; // Default to 'Appetizer'
    const foodItems = await FoodItem.find({ category }); // Fetch items based on category
    res.render('users/order', { foodItems, category });
};


async function postOrder(req, res) {
    const userId = req.user._id;
    const { itemId, quantity } = req.body;
    const person = await User.findById(userId);
    try {
        // Check for a pending order, if none exists, create a new one
        let order = await Order.findOne({ user: userId, status: 'pending' });

        if (!order) {
            // If no pending order, create a new one
            order = new Order({
                user: userId,
                items: [],
                totalBill: 0,
                status: 'pending',
                specialInstructions: 'None',
                deliveryAddress: person.address,
            });
        }

        // Check if the item is already in the order
        const existingItem = order.items.find(item => item.foodItem.equals(itemId));
        if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += parseInt(quantity);
        } else {
            // Add new item to order
            order.items.push({ foodItem: itemId, quantity: parseInt(quantity) });
        }

        // Recalculate total bill
        order.totalBill = await calculateTotalBill(order.items);

        // Save the updated/new order
        await order.save();

        res.redirect('/user/order');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

async function suggestOrder(req,res){
    res.render("users/suggestorder");
}
async function giveOrder(req,res){
    const teamUser = await User.find({role:"team"}); //should get an array of 5 team members, randomly display one's name
    function getRandomTeamMember() {
        const randomIndex = Math.floor(Math.random() * teamUser.length);
        return teamUser[randomIndex];
    }
    const teamMember = getRandomTeamMember();
    const userid = req.user._id;
    const userOrder = await User.findById(userid);
    const { cuisineType, isJain, specialPreferences } = req.body;
    let foodItems;
    if (isJain === 'true') {
        foodItems = await FoodItem.find({ isJain: true }); // Only Jain items
    } else {
        foodItems = await FoodItem.find(); // Non-Jain can have both Jain and non-Jain items
    }
    if (cuisineType === 'Continental') {
        // Display only Continental dishes
        foodItems = foodItems.filter(item => item.cuisineType === 'Continental');
    } else if (cuisineType === 'Punjabi' || cuisineType === 'Chinese' || cuisineType === 'Gujarati' || cuisineType === 'South Indian') {
        // Display dishes from selected cuisine AND Indian cuisine
        foodItems = foodItems.filter(item => item.cuisineType === cuisineType || item.cuisineType === 'Indian');
    } else if (cuisineType === 'Indian') {
        // Display all Indian cuisines (Punjabi, Chinese, Gujarati, South Indian) but exclude Continental
        foodItems = foodItems.filter(item => item.cuisineType !== 'Continental');
    }
    const soups = foodItems.filter(item => item.category === 'Soup');
    const appetizers = foodItems.filter(item => item.category === 'Appetizer');
    const mainCourses = foodItems.filter(item => item.category === 'Main Course');
    const sideDishes = foodItems.filter(item => item.category === 'Side Dish');
    const desserts = foodItems.filter(item => item.category === 'Dessert');

    // Step 3: Randomly select items from each category
    const getRandomItems = (items, num) => {
        let shuffled = [...items].sort(() => 0.5 - Math.random()); // Shuffle the array
        return shuffled.slice(0, num); // Return the first 'num' items
    };

    // Get the desired number of items from each category
    const selectedSoups = getRandomItems(soups, 2);
    const selectedAppetizers = getRandomItems(appetizers, 3);
    const selectedMainCourses = getRandomItems(mainCourses, 3);
    const selectedSideDishes = getRandomItems(sideDishes, 3);
    const selectedDesserts = getRandomItems(desserts, 2);

    // Step 4: Combine all selected items into a list
    const suggestedMenu = [
        ...selectedSoups,
        ...selectedAppetizers,
        ...selectedMainCourses,
        ...selectedSideDishes,
        ...selectedDesserts
    ];

    const items = [];
    let totalBill = 0;

    for (const item of suggestedMenu) {
        items.push({
            foodItem: item._id, // FoodItem ID
            quantity: 1 // Starting with quantity of 1 for each item
        });
        totalBill += item.price; // Assuming each item has a price property
    }

    // Define the delivery address and special instructions
    const deliveryAddress = userOrder.address; // Replace with actual address
    const specialInstructions = specialPreferences || 'none'; // Use special preferences or default to 'none'

    // Create the new order
    const newOrder = new Order({
        user: userOrder,
        items,
        totalBill,
        deliveryAddress,
        specialInstructions,
    });

    try {
        await newOrder.save(); // Save the order to the database
        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create order', error });
    }

    // req.flash('info',` Our team member ${teamMember.name} will send you an order recommendation.Check Homepage soon `);
    // //res.redirect('/user/suggestorder');
    // res.json(suggestedMenu);
}

async function getProfile(req, res) {
    try {
        const userId = req.user._id; // Assuming user info is stored in req.user
        const user = await User.findById(userId).populate('orderHistory'); // Populate orderHistory with Order details

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('users/profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

async function getCart(req, res) {
    const userId = req.user._id;

    try {
        const order = await Order.findOne({ user: userId, status: 'pending' }).populate('items.foodItem');

        if (!order) {
            return res.redirect('/user/order');  // Redirect to order page if no pending order
        }

        const user = await User.findById(userId);  // Get user details

        res.render('users/cart', { order, orderPerson: user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}
async function calculateTotalBill(items) {
    let totalBill = 0;

    for (const item of items) {
        const foodItem = await FoodItem.findById(item.foodItem); // Ensure you're getting the correct food item
        if (foodItem) {
            totalBill += foodItem.price * item.quantity; // Calculate total price for each item
        }
    }

    return totalBill;
}

async function updateCartItem(req, res) {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;

    // console.log('Parsed itemId:', itemId);
    // console.log('Parsed quantity:', quantity);

    try {
        // Find the user's pending order
        const order = await Order.findOne({ user: userId, status: 'pending' });

        if (!order) {
            return res.status(404).send('No pending order found');
        }

        // Find the item in the order and update its quantity
        const item = order.items.find(i => i._id.equals(itemId)); // Ensure itemId matches order items
        if (item) {
            item.quantity = parseInt(quantity);
           // console.log('Updated Item:', item);
        } else {
            return res.status(404).send('Item not found in order');
        }

        // Recalculate the total bill
        order.totalBill = await calculateTotalBill(order.items);
        await order.save();

        // Redirect to the cart page after updating
        res.redirect('/user/cart');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

async function handleCheckout(req, res) {
    const userId = req.user._id;
    const specialInstructions = req.body.specialInstructions || 'none';  // Default to 'none' if not provided

    try {
        // Find the user's pending order
        const order = await Order.findOne({ user: userId, status: 'pending' }).populate('items.foodItem');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        let totalWeight = 0;
        let totalBill = 0;

        order.items.forEach(item => {
            totalWeight += item.quantity * item.foodItem.weight; // Weight in grams
            totalBill += item.quantity * item.foodItem.price; // Price in currency
        });

        if (totalWeight < 5000 && totalBill < 6000) {
            return res.status(400).send('Either total order must be at least 5 kg, or the total bill must be at least 6000 currency units.');
        }

        // Update special preferences and order status
        order.specialInstructions = specialInstructions;
        order.status = 'confirmed'; // Update the status to confirmed
        await order.save();
        await User.findByIdAndUpdate(userId, {
            $push: { orderHistory: order._id }
        });
        // Redirect directly to the order history after confirmation
        res.redirect('/user/orderhistory');  
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error occurred. Please try again later.');
    }
}

async function getOrderHistory(req, res) {
    const userId = req.user._id; // Get user ID from the request
    try {
        
        const orders = await Order.find({ user: userId, status: 'confirmed' })
            .populate('items.foodItem'); // Populate food item details

            const user = await User.findById(userId).populate('orderHistory');
        
            // Render the order history page and pass the user's order history
            res.render('users/orderHistory', { orders,user});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

module.exports = { getHome,displayCategory,categoryCart,suggestOrder,giveOrder, getOrder, postOrder, getProfile, getOrderHistory, handleCheckout, getCart, updateCartItem };
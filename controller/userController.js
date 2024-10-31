const FoodItem = require('../model/foodItemsSchema');
const User = require('../model/userSchema');
const Order = require("../model/orderSchema");
const Thali = require("../model/thaliSchema");
const ThaliOrder = require("../model/thaliOrderSchema");
const Offer = require("../model/offerSchema");
const mongoose = require('mongoose'); // Make sure you have this at the top of your file

const jwt = require('jsonwebtoken');

async function getHome(req, res) {
    try {
        const userId = req.user._id; // Assuming user ID is stored in the token
        //console.log(userId);
        const person = await User.findById(userId);
        const userName =person.name; // Retrieve the user's name from the token

        // Fetch user orders (assuming you want the last 3 orders)
        const simpleOrders = await Order.find({ user: userId }).populate('items.foodItem');
        const thaliOrders = await ThaliOrder.find({ userId }).sort({ createdAt: -1 }).limit(1);

        // Fetch random popular food items
        const popularItems = await FoodItem.aggregate([{ $sample: { size: 4 } }]); // Fetch 4 random food items

        // Fetch offers and exclude those that belong to the logged-in user
        const offers = await Offer.find({ userId: { $ne: userId } });

        // Fetch reviews for the home page
        const randomUsers = await User.aggregate([
            { $match: { _id: { $ne: userId } } }, // Exclude the current user
            { $sample: { size: 10 } },
            { $project: { name: 1 } }
        ]);

        // Create random order types and descriptions for each user
        const orderTypes = ['Thali', 'Tiffin', 'Catering'];
        const descriptions = [
            "Absolutely loved the food quality!",
            "The thali was delightful and filling.",
            "Tiffin service is excellent, highly recommend!",
            "Great taste, will order again!",
            "The catering service exceeded my expectations.",
            "Perfectly spiced dishes, very enjoyable.",
            "Quick delivery and tasty food!",
            "The variety in the thali is impressive.",
            "Fresh and delicious meals every time.",
            "Satisfying tiffin service with good portions."
        ];

        const userReviews = randomUsers.map((user, index) => ({
            name: user.name,
            orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
            description: descriptions[index % descriptions.length] // Loop through descriptions
        }));

        // Render the user homepage with the gathered data
        res.render('users/userHome', {
            userName,
            simpleOrders,
            thaliOrders,
            popularItems,
            offers,
            userReviews
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
}


async function displayCategory(req,res){
    const categoryId = req.params.id;
    let foodItems;
    const cuisineMapping = {
        jain: { isJain: true },
        continental: { cuisineType: 'Continental' },
        gujarati: { $or: [{ cuisineType: 'Gujarati' }, { cuisineType: 'Indian' }] },
        southindian: { $or: [{ cuisineType: 'South Indian' }, { cuisineType: 'Indian' }] },
        chinese: { $or: [{ cuisineType: 'Chinese' }, { cuisineType: 'Indian' }] },
        punjabi: { $or: [{ cuisineType: 'Punjabi' }, { cuisineType: 'Indian' }] },
        indian: { cuisineType: { $ne: 'Continental' } }
    };

    try {
        if (categoryId === 'jain') {
            // Retrieve all Jain items
            foodItems = await FoodItem.find(cuisineMapping.jain);
        } else if (cuisineMapping[categoryId]) {
            // Use mapped value if category exists in the map
            foodItems = await FoodItem.find(cuisineMapping[categoryId]);
        } else {
            return res.status(404).send('Category not found');
        }
        // Render the page with the retrieved food items
        res.render('users/categoryDisplay', { foodItems, categoryId });
        //res.json(categoryId)
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
         req.flash('info',` Our team member ${teamMember.name} will send you an order recommendation.Check Cart soon `);
         res.redirect('/user/suggestorder');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create order', error });
    }
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

async function postProfile(req,res){
    const tiffinSubscriber = req.body.tiffinSubscriber === 'true';
    //console.log(tiffinSubscriber);
    const userId = req.user._id; 
    //console.log(userId)
    User.findByIdAndUpdate(userId, { isTiffinSubscriber: tiffinSubscriber })
        .then(() => {
            res.redirect('/user/profile'); // Redirect to the profile page or wherever you want
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error updating subscription.");
        });
}

async function getCart(req, res) {
    const userId = req.user._id;

    try {
        const order = await Order.findOne({ user: userId, status: 'pending' }).populate('items.foodItem');

        // if (!order) {
        //     return res.redirect('/user/order');  // Redirect to order page if no pending order
        // }

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

async function getThali(req, res) {
    try {
        // Fetch all thalis and populate the food item details
        const thalis = await Thali.find().populate('items.foodItemId'); // Adjust 'items.foodItemId' based on your schema
        res.render("users/orderThali", { thalis });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching thali data');
    }
}

async function postThaliOrder(req, res) {
    try {
        const userId = req.user._id;  // Get user ID from the request

        // Iterate over each quantity input in the form
        for (const key in req.body) {
            if (key.startsWith("quantity-")) {
                const thaliId = key.split("-")[1];
                const quantity = parseInt(req.body[key]);

                // Check if quantity meets minimum requirements
                const isTiffin = req.body.isTiffin === 'true';
                const minQuantity = isTiffin ? 50 : 20;

                if (quantity >= minQuantity) {
                    // Retrieve the thali to get its totalPrice
                    const thali = await Thali.findById(thaliId);
                    if (!thali) {
                        console.error(`Thali with ID ${thaliId} not found.`);
                        continue;  // Skip to the next item if the thali isn't found
                    }

                    // Calculate the total cost for the selected quantity of this thali
                    const total = thali.totalPrice * quantity;

                    // Create a new ThaliOrder with the calculated total
                    await ThaliOrder.create({
                        quantity,
                        thaliId,
                        userId,
                        isTiffin,
                        duration: isTiffin ? req.body.duration : null,
                        total,  // Add the calculated total
                    });
                }
            }
        }

        // Redirect back to the thali order page
        res.redirect("/user/thali/history");

    } catch (error) {
        console.error("Error creating ThaliOrder:", error);
        res.status(500).send("Server Error");
    }
}

async function getThaliHistory(req, res) {
    try {
        const userId = req.user._id;  // assuming `req.user` contains the authenticated user's data
        const thaliOrders = await ThaliOrder.find({ userId }).populate('thaliId');
        const user = await User.findById(userId);  // Fetch user details

        res.render("users/thaliHistory", { thaliOrders, user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving thali order history.");
    }
}


async function getTiffin(req, res) {
    try {
        const userId = req.user._id;  // assuming `req.user` contains the authenticated user's data
        const user = await User.findById(userId);

        if (!user.isTiffinSubscriber) {
            // Render a message prompting the user to enable tiffin subscription
            return res.render("users/orderTiffin", { isTiffinSubscriber: false });
        }

        const thalis = await Thali.find(); // Fetch all thalis to display for subscribers
        res.render("users/orderTiffin", { thalis, isTiffinSubscriber: true });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving tiffin order page.");
    }
}

async function orderTiffin(req, res) {
    const thaliOrders = [];
    const person = await User.findById(req.user._id);

    try {
        // Loop through each thaliId provided in the request
        const thaliIds = req.body.thaliId; // Array of thali IDs
        for (const thaliId of thaliIds) {
            // Get the quantity and duration for this thali
            const quantity = req.body[`quantity-${thaliId}`];
            const duration = req.body[`duration-${thaliId}`];
            
            // Only process if both quantity and duration are provided and are valid
            if (quantity && duration && quantity >= 50 && duration > 5) {
                // Find the thali to get its totalPrice
                const thali = await Thali.findById(thaliId).select('totalPrice');

                if (thali) {
                    const totalPrice = thali.totalPrice;
                    const total = parseInt(quantity) * totalPrice;

                    // Push the order details into the array
                    thaliOrders.push({
                        quantity: parseInt(quantity),
                        thaliId: thaliId,
                        userId: req.user._id, // Assuming user ID is available in req.user
                        duration: parseInt(duration),
                        isTiffin: true, // Indicate that this is a tiffin order
                        total: total // Calculate total as quantity * totalPrice
                    });
                }
                person.isTiffinSubscriber = true;
            }
        }

        // Only save orders if there are valid entries
        if (thaliOrders.length > 0) {
            await ThaliOrder.insertMany(thaliOrders);
        }

        res.redirect('/user/thali/history'); // Redirect to history page after successful order
    } catch (error) {
        console.error(error);
        res.status(500).send('Error placing tiffin order');
    }
}

module.exports = { getHome,getThali,orderTiffin,getThaliHistory,postThaliOrder,getTiffin,displayCategory,categoryCart,suggestOrder,giveOrder, getOrder, postOrder, getProfile,postProfile, getOrderHistory, handleCheckout, getCart, updateCartItem };
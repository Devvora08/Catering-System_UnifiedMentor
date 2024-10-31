const express = require('express');
const router = express.Router();
const {setUser} = require('../service/auth');
const FoodItem = require("../model/foodItemsSchema");
const Offer = require("../model/offerSchema");
const User = require('../model/userSchema');

//for home routes no need to make controller, keep here 
router.get("/", async (req, res) => {
    try {
        // 1. Retrieve features (could be hard-coded or retrieved from a model)
        const features = [
            { title: 'Thali', image: '/static/mainhome/mainhome1.webp' },
            { title: 'Tiffin', image: '/static/mainhome/mainhome2.avif' },
            { title: 'Catering', image: '/static/mainhome/mainhome3.jpg' },
            { title: 'Jain', image: '/static/mainhome/mainhome4.png' },
            { title: 'Continental', image: '/static/mainhome/mainhome5.jpg' }
        ];

        // 2. Retrieve random food items for the carousel
        const randomFoodItems = await FoodItem.find({});

        // 3. Retrieve ongoing offers
        const ongoingOffers = await Offer.find().sort({ createdAt: -1 }).limit(3);

        // 4. Retrieve team members
        const teamMembers = await User.find({ role: 'team' }).limit(5); // Assuming 'team' role for members
        const admins = await User.find({ role: 'admin' }).limit(2); // Assuming 'admin' role for admins

        // Render home page with the retrieved data
        res.render('homePage', {
            features,
            randomFoodItems,
            ongoingOffers,
            teamMembers,
            admins
        });
    } catch (error) {
        console.error("Error fetching data for home page:", error);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/signup', (req, res) => {
    const messages = {
        error: req.flash('error'),
        success: req.flash('success'),
    };
    res.render('signup', { messages }); // Pass messages to EJS
});
router.get('/login',(req,res)=>{
    res.render('login')
});
router.post('/login',async (req,res)=>{

    const userbody = req.body; 
    try {
        const checkuser = await User.findOne({ email: userbody.email, password: userbody.password });
        if (!checkuser) {
            return res.status(401).redirect('/'); // Redirect to home if user not found
        }
    
        let token;
    
        // Create token with user details
        token = setUser(checkuser.toObject());
    
        res.cookie("uid", token); // Set the token in the cookie
    
        // Redirect based on user role
        let userRole = checkuser.role;
        if (userRole === 'admin') {
            return res.redirect('/admin/home');
        } else if (userRole === 'team') { 
            return res.redirect('/team/home'); 
        } else if (userRole === 'user') {
            return res.redirect('/user/home');
        } else {
            return res.status(400).json({ msg: "Invalid user role" });
        }        
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ msg: "Internal server error" });
    }
})

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already in use. Please choose another one.');
            return res.redirect('/signup'); // Redirect back to the signup page
        }

        // Create a new user without password hashing
        const newUser = new User({
            name,
            email,
            password,  // Use the plain password as per your setup
            phone,
            address,
            role: 'user', // Default role is user
        });

        // Save the user to the database
        await newUser.save();

        // Set flash message for successful signup
        req.flash('success', 'Congratulations! Your account has been created.');
        res.redirect('/signup'); // Redirect to home page (or wherever you want)
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while creating your account. Please try again.');
        res.redirect('/signup'); // Redirect back to the signup page on error
    }
});

module.exports = router;
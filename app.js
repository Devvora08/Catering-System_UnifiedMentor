const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

// Export all collections here
const FoodItem = require('./model/foodItemsSchema');
const Order = require('./model/orderSchema');
const User = require('./model/userSchema');

//import all routes here
const homeRoutes = require('./routes/homeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');

//middleware import
const {restrictToLoggedInOnly, restrictTo} = require('./middleware/middleware');

const app = express();
const port = process.env.PORT || 3000;   // using env file for dynamic porting for deployement

mongoose.connect("mongodb://127.0.0.1:27017/CateringCraft").then(()=>{
    console.log('Connection to the Catering-Craft Database has been established !');
}).catch((err)=>{
    console.log('error found - ',err);
});

//Setting up the view engine for frontend ui
app.set('view engine', 'ejs');
app.set('views',path.resolve('./views'));

//Express Middlewares setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: 'your_secret', // Change this to a more secure value
    resave: false,
    saveUninitialized: false
}));

// Use connect-flash middleware
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.info_msg = req.flash('info'); // For the specific message
    next();
});

//Router function here
app.use('/',homeRoutes);
app.use('/user',restrictToLoggedInOnly,restrictTo(["user"]),userRoutes);
app.use('/admin',restrictToLoggedInOnly,restrictTo(["admin"]),adminRoutes);
app.use('/team',restrictToLoggedInOnly,restrictTo(["team"]),teamRoutes);


const Thali = require('./model/thaliSchema');
async function insertGujaratJainThali() {
    const gujaratiJainThali = {
      name: "Gujarati Jain Thali",
      isJain: true,
      items: [
        {
          foodItemId: "6713566584ad46030eb97426", // Dhokla
          quantity: 1,
          price: 250
        },
        {
          foodItemId: "6713566584ad46030eb97427", // Khandvi
          quantity: 1,
          price: 500
        },
        {
          foodItemId: "6713566584ad46030eb97428", // Masala Papad
          quantity: 1,
          price: 300
        },
        {
          foodItemId: "671397d28b591aca420bcee4", // Aloo Methi
          quantity: 1,
          price: 200
        },
        {
          foodItemId: "671397d28b591aca420bcee5", // Baingan Bharta
          quantity: 1,
          price: 250
        },
        {
          foodItemId: "671397d28b591aca420bcee7", // Dal Dhokli
          quantity: 1,
          price: 250
        },
        {
          foodItemId: "671397d28b591aca420bceeb", // Kadhi
          quantity: 1,
          price: 500
        },
        {
          foodItemId: "6713ac039dbb884f4d05b201", // Gajar Halwa
          quantity: 1,
          price: 300
        }
      ],
      category:"Gujarati",
      totalPrice: 2550, // Sum of all item prices
      minPrice: 1500 // Example minimum price condition
    };
  
    try {
      const newThali = new Thali(gujaratiJainThali);
      await newThali.save();
      //console.log("Gujarati Jain Thali inserted successfully:", newThali);
    } catch (error) {
      console.error("Error inserting Gujarati Jain Thali:", error);
    }
  }
  //insertGujaratJainThali()
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
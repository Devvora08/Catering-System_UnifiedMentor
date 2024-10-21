const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');


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

//Router function here
app.use('/',homeRoutes);
app.use('/user',restrictToLoggedInOnly,restrictTo(["user"]),userRoutes);
app.use('/admin',restrictToLoggedInOnly,restrictTo(["admin"]),adminRoutes);
app.use('/team',restrictToLoggedInOnly,restrictTo(["team"]),teamRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
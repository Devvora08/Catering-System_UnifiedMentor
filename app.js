const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

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

app.get("/", (req,res)=>{
    res.render('homePage');
})


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
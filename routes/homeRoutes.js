const express = require('express');
const router = express.Router();
const {setUser} = require('../service/auth');

const User = require('../model/userSchema');

//for home routes no need to make controller, keep here 
router.get("/",(req,res)=>{
    res.render('homePage');
});
router.get('/signup',(req,res)=>{
    res.render("signup");
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

    // const {email, password} = req.body;
    // if(!email || !password) return res.json({error:"Please enter both credentials properly"});

    // const signedIn = await User.findOne({email:email,password:password});
    // //retrieve the role from signedin person to redirect them to their routes
    // const role = signedIn.role;
    // //console.log(role);
    // if(!role) return res.json({error:"Please enter both credentials properly"});
    // if(role == "admin"){
    //     res.redirect("/admin/home");
    // }
    // else if(role == "team"){
    //     res.redirect("/team/home");
    // }
    // else if(role == "user"){
    //     res.redirect("/user/home");
    // }

})

module.exports = router;
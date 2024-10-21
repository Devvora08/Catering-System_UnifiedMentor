const jwt = require('jsonwebtoken');
const secret = "devvora1532@";

function setUser(user) {
    return jwt.sign({
        _id: user._id,
        email: user.email,
        role: user.role  
    },
    "devvora1532@"
    );
}
function getUser(token){
    if(!token) return null;
    try{
        return jwt.verify(token, secret);
    }
    catch(error){
        return null;
    }
};
module.exports = {
    setUser,
    getUser,
};
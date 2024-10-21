const express = require('express');
const router = express.Router();

const {getHome,getOrderHistory,getProfile,getCart,getOrder,postOrder} = require('../controller/userController');

router.get("/home",getHome);
router.get("/order",getOrder);
router.post("/order",postOrder);

router.get("/cart",getCart);
router.get("/profile",getProfile);
router.get("/orderhistory",getOrderHistory);

module.exports = router;
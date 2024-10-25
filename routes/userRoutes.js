const express = require('express');
const router = express.Router();

const {getHome,getOrderHistory,getProfile,orderTiffin,postProfile,getThali,getThaliHistory,postThaliOrder,getTiffin,getCart,categoryCart,giveOrder,displayCategory,getOrder,postOrder,updateCartItem,handleCheckout,suggestOrder} = require('../controller/userController');

router.get("/home",getHome);
router.get("/displaycategory/:id",displayCategory);


router.get("/order",getOrder);
router.post("/order",postOrder);

router.get("/cart",getCart);
router.get("/suggestorder",suggestOrder);
router.post("/suggestOrder",giveOrder);

router.post("/cart/update",updateCartItem);
router.post("/cart/add",categoryCart);
router.post("/cart/checkout",handleCheckout);

router.get("/profile",getProfile);
router.post("/profile",postProfile);

router.get("/thali/order",getThali);
router.post("/thali/order",postThaliOrder);

router.get("/thali/tiffin",getTiffin)
router.post("/tiffin/order",orderTiffin);

router.get("/thali/history",getThaliHistory);
// router.get("/thali/tiffinHistory",getTiffinHistory)

router.get("/orderhistory",getOrderHistory);

module.exports = router;
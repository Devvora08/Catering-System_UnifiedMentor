const express = require('express');
const router = express.Router();

const{getTeamHome,seeMessages,createOffer} = require('../controller/teamController');

router.get("/home",getTeamHome)
router.get("/messages",seeMessages);
router.post("/create-offer",createOffer);

module.exports = router;
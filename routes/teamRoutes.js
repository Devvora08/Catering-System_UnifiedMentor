const express = require('express');
const router = express.Router();

const{getTeamHome,seeMessages} = require('../controller/teamController');

router.get("/home",getTeamHome)
router.get("/messages",seeMessages);

module.exports = router;
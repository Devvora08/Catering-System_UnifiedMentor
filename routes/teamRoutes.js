const express = require('express');
const router = express.Router();

const{getTeamHome} = require('../controller/teamController');

router.get("/home",getTeamHome)

module.exports = router;
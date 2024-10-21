const express = require('express');
const router = express.Router();

const {getHome} = require('../controller/adminController');

router.get('/home',getHome);

module.exports = router;
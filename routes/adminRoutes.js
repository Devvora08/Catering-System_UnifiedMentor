const express = require('express');
const router = express.Router();

const {getHome,manageOrder,deletePending,userBills,thaliOrder,getMessage,postMessage,seeMessages,viewTeam} = require('../controller/adminController');

router.get('/home',getHome);
router.get("/ordermanage",manageOrder);
router.post("/deleteOrder/:id",deletePending);

router.get("/thaliorders",thaliOrder)
router.get("/bills",userBills);

router.get("/message",getMessage);
router.post("/message",postMessage);
router.get("/seeMessages",seeMessages);

router.get("/team",viewTeam);

module.exports = router;
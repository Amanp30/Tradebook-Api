const express = require("express");
const { bytimeframe, bysymbol } = require("../controllers/Reports.js");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/report/bytimeframe/:userid", requireSignin, bytimeframe);
router.get("/report/bysymbol/:userid", requireSignin, bysymbol);

module.exports = router;

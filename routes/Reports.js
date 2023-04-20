const express = require("express");
const { bytimeframe } = require("../controllers/Reports.js");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/report/bytimeframe/:userid", requireSignin, bytimeframe);

module.exports = router;

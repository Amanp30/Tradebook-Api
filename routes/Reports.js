const express = require("express");
const {
  bytimeframe,
  bysymbol,
  byyearly,
} = require("../controllers/Reports.js");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/report/bytimeframe/:userid", requireSignin, bytimeframe);
router.get("/report/bysymbol/:userid", requireSignin, bysymbol);
router.get("/report/byyearly/:userid", requireSignin, byyearly);

module.exports = router;

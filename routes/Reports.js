const express = require("express");
const {
  bytimeframe,
  bysymbol,
  byyearly,
  bymonthly,
  byweekdays,
} = require("../controllers/Reports");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/report/bytimeframe/:userid", requireSignin, bytimeframe);
router.get("/report/bysymbol/:userid", requireSignin, bysymbol);
router.get("/report/byyearly/:userid", requireSignin, byyearly);
router.get("/report/bymonthly/:userid", requireSignin, bymonthly);
router.get("/report/byweekday/:userid", requireSignin, byweekdays);

module.exports = router;

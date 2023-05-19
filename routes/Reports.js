const express = require("express");
const {
  bytimeframe,
  bysymbol,
  byyearly,
  bymonthly,
  byweekdays,
  byvolumes,
  byhourly,
  calendarReport,
  byholdingtime,
} = require("../controllers/Reports");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/report/bytimeframe/:userid", requireSignin, bytimeframe);
router.get("/report/bysymbol/:userid", requireSignin, bysymbol);
router.get("/report/byyearly/:userid", requireSignin, byyearly);
router.get("/report/bymonthly/:userid", requireSignin, bymonthly);
router.get("/report/byweekday/:userid", requireSignin, byweekdays);
router.get("/report/byvolume/:userid", requireSignin, byvolumes);
router.get("/report/byhourly/:userid", requireSignin, byhourly);
router.get("/report/byholdingtime/:userid", requireSignin, byholdingtime);
router.get("/report/calendar/:userid", requireSignin, calendarReport);

module.exports = router;

const express = require("express");
const {
  getTradingsystems,
  newTradingsystem,
  viewSystem,
  updateTradingsystem,
  deleteTradingsystem,
} = require("../controllers/Tradingsystem");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/tradingsystem/view/:systemid/:userid", requireSignin, viewSystem);
router.get("/tradingsystem/get/:userid", requireSignin, getTradingsystems);
router.get(
  "/tradingsystem/delete/:systemid/:userid",
  requireSignin,
  deleteTradingsystem
);

router.post("/tradingsystem/new/:userid", requireSignin, newTradingsystem);
router.post(
  "/tradingsystem/update/:systemid/:userid",
  requireSignin,
  updateTradingsystem
);

module.exports = router;

const express = require("express");
const {
  addTrade,
  DistinctSymbols,
  showtrades,
  editTrade,
  deleteTradeById,
  updateTrade,
} = require("../controllers/Trade");
const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.post("/trade/add", requireSignin, addTrade);
router.post("/trade/update/:tradeid", requireSignin, updateTrade);

router.get("/trade/distinctsymbol", requireSignin, DistinctSymbols);
router.get("/trade/edit/:tradeid/:userid", requireSignin, editTrade);
router.get("/trade/delete/:tradeid", requireSignin, deleteTradeById);
router.get("/trade/showtrades/:userid", requireSignin, showtrades);

module.exports = router;

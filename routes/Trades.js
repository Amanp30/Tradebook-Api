const express = require("express");
const {
  addTrade,
  DistinctSymbols,
  showtrades,
  editTrade,
  deleteTradeById,
  updateTrade,
  saveNewNamesofSymbols,
  addNote,
  deleteNote,
  updateNote,
  oneTradeview,
  paginateTrades,
  dashboardtradesreport,
} = require("../controllers/Trade");
const { requireSignin } = require("../validators/jwtvalidator");
const { tradeValidator } = require("../validators/tradeValidate");
const { runValidation } = require("../validators/index");

const router = express.Router();

router.get(
  "/trade/dashboardreports/:userid",
  requireSignin,
  dashboardtradesreport
);

router.post(
  "/trade/add",
  // tradeValidator,
  // runValidation,
  requireSignin,
  addTrade
);
router.post("/trade/update/:tradeid", requireSignin, updateTrade);
router.post("/trade/nameupdate/:userid", requireSignin, saveNewNamesofSymbols);

// addnote
router.post("/trade/notes/addnote/:tradeid/:userid", requireSignin, addNote);
router.post(
  "/trade/notes/deletenote/:tradeid/:userid",
  requireSignin,
  deleteNote
);
router.post(
  "/trade/notes/updatenote/:tradeid/:userid",
  requireSignin,
  updateNote
);

router.get("/trade/distinctsymbol/:userid", requireSignin, DistinctSymbols);
router.get("/trade/edit/:tradeid/:userid", requireSignin, editTrade);
router.get("/trade/onetradeview/:tradeid/:userid", requireSignin, oneTradeview);
router.get("/trade/delete/:tradeid", requireSignin, deleteTradeById);
router.get("/trade/showtrades/:userid", requireSignin, showtrades);
router.get("/trade/paginate/:userid/", requireSignin, paginateTrades);

module.exports = router;

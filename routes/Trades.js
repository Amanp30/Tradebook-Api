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
} = require("../controllers/Trade");
const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.post("/trade/add", requireSignin, addTrade);
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

module.exports = router;

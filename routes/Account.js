const express = require("express");
const { getUserData, saveUserData } = require("../controllers/Account");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.get("/account/:userid", requireSignin, getUserData);

router.post("/account/save/:userid", requireSignin, saveUserData);

module.exports = router;

const express = require("express");
const { newStrategy } = require("../controllers/Strategy");

const { requireSignin } = require("../validators/jwtvalidator");

const router = express.Router();

router.post("/strategy/new/:userid", requireSignin, newStrategy);

module.exports = router;

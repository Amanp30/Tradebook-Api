const express = require("express");
const {
  addnew,
  signin,
  forgotPassword,
  resetPassword,
} = require("../controllers/User");
const router = express.Router();

router.post("/user/forgotpassword", forgotPassword);
router.post("/user/reset/:link", resetPassword);

router.post("/user/login", signin);
router.post("/user/signup", addnew);

module.exports = router;

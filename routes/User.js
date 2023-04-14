const express = require("express");
// const ChainingFunction = require("../validators/customvalidator");
const {
  addnew,
  signin,
  forgotPassword,
  resetPassword,
  helloji,
} = require("../controllers/User");
const router = express.Router();

// console.log(ChainingFunction.create().add(5).add(65).multiply(54));

router.get("/user/helloji", helloji);
router.post("/user/forgotpassword", forgotPassword);
router.post("/user/reset/:link", resetPassword);

router.post("/user/login", signin);
router.post("/user/signup", addnew);

module.exports = router;

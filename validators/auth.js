const { check } = require("express-validator");

exports.userSignupvalidator = [
  check("email").isEmail().withMessage("This is not a valid email!"),
  //check("name").not().isEmpty().withMessage("Name is required"),
  check("password")
    .not()
    .isEmpty()
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters long"),
];

exports.userSigninvalidator = [
  check("email").isEmail().withMessage("This is not a valid email!"),
  check("password")
    .not()
    .isEmpty()
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters long"),
];

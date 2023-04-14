var { expressjwt: jwt } = require("express-jwt");

exports.requireSignin = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

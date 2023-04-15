const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      require: true,
      default: "",
    },
    lastname: {
      type: String,
      require: true,
      default: "",
    },
    email: {
      type: "String",
      lowerCase: true,
    },
    state: {
      type: String,
      default: "",
    },
    mobileno: {
      type: String,
      default: "",
    },
    broker: { type: String, default: "" },
    hashed_password: {
      type: "String",
    },
    salt: "String",
    resetPasswordLink: {
      type: String,
      default: "",
    },
  } /* , {_id : false} Do this to remove schema id */
);

userSchema
  .virtual("password")
  .set(function (password) {
    // temp var _password
    this._password = password;
    //genereate salt
    this.salt = this.makeSalt();
    //encrypted password
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  authenticate: function (plainPassword) {
    return this.encryptPassword(plainPassword) === this.hashed_password;
  },
  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

module.exports = mongoose.model("User", userSchema);

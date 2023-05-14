const mongoose = require("mongoose");
const crypto = require("crypto");

const tradingsystemSchema = new mongoose.Schema(
  {
    tradingsystem: {
      type: String,
      default: "",
    },
    systemname: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  } /* , {_id : false} Do this to remove schema id */
);

module.exports = mongoose.model("Tradingsystem", tradingsystemSchema);

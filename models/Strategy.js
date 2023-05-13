const mongoose = require("mongoose");
const crypto = require("crypto");

const strategySchema = new mongoose.Schema(
  {
    strategy: {
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

module.exports = mongoose.model("Strategy", strategySchema);

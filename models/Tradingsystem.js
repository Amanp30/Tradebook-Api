const mongoose = require("mongoose");

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
  },
  {
    timestamps: true, // Add this line to enable timestamps
  }
);

module.exports = mongoose.model("Tradingsystem", tradingsystemSchema);

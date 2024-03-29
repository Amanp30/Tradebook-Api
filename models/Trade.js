const mongoose = require("mongoose");

const schema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    // lowercase: true,
  },

  tradingsystem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tradingsystem",
    required: true,
    // lowercase: true,
  },

  chart: {
    type: String,
    default: "",
  },
  outcome: { type: String, default: "" },
  action: {
    type: String,
    required: true,
    // enum: ["Buy", "Sell"],
    // lowercase: true,
  },
  entrydate: {
    type: Date,
    required: true,
  },
  exitdate: {
    type: Date,
    required: true,
  },
  entryprice: {
    type: Number,
    required: true,
  },
  exitprice: {
    type: Number,
    required: true,
  },
  takeprofit: {
    type: Number,
    required: true,
  },
  stoploss: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    validate: {
      validator: function (value) {
        return value >= 1;
      },
      message: "Quantity must be greater than or equal to 1.",
    },
    required: true,
    min: 1,
  },
  fees: {
    type: Number,
    required: true,
  },
  netpnl: {
    type: Number,
    required: true,
  },
  profit: {
    type: Number,
    required: true,
  },
  pnlpershare: {
    type: Number,
    required: true,
  },
  returnpercent: {
    type: Number,
    required: true,
  },
  timeframe: {
    type: String,
    required: true,
  },
  emotions: {
    type: String,
  },
  // strategy: {
  //   type: String,
  //   // required: true,
  //   // lowercase: true,
  // },
  notes: {
    type: [String],
    // required: true,
    lowercase: true,
  },
  // turnover: {
  //   type: Number,
  //   required: true,
  //
  // },
  /*  ordertype: {
    type: String,
    required: true,
    lowercase: true,
  }, */
  marketcondition: {
    type: String,
    // required: true,
    // lowercase: true,
  },
  rrrplanned: {
    type: Number,
    required: true,
  },
  rmultiple: {
    type: Number,
    required: true,
  },
  rmultipledifference: {
    type: Number,
    required: true,
  },
  holdingperiod: {
    type: Number,
    required: true,
  },
};

const tradeSchema = new mongoose.Schema(schema, {
  timestamps: true, // Add this line to enable timestamps
});

module.exports = mongoose.model("Trade", tradeSchema);

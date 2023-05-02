const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const { extractFields } = require("../helpers/extractfields");
const fs = require("fs");
const formidable = require("formidable");
const form = formidable({ multiples: true });
const { colorchartjs } = require("colorchartjs");
const _ = require("lodash");

exports.gettingReports = (req, res) => {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.params.userid),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$entrydate" },
          month: { $month: "$entrydate" },
          week: { $week: "$entrydate" },
        },
        totalPnL: { $sum: "$netpnl" },
        countTrades: { $sum: 1 },
        winRate: {
          $avg: {
            $cond: [{ $gt: ["$netpnl", 0] }, 1, 0],
          },
        },
        lossRate: {
          $avg: {
            $cond: [{ $lt: ["$netpnl", 0] }, 1, 0],
          },
        },
        breakevenRate: {
          $avg: {
            $cond: [{ $eq: ["$netpnl", 0] }, 1, 0],
          },
        },
        totalFees: { $sum: "$fees" },
        totalProfit: { $sum: "$profit" },
        totalPnLPerShare: { $sum: "$pnlpershare" },
        totalReturnPercent: { $sum: "$returnpercent" },
        totalRRRPlanned: { $sum: "$rrrplanned" },
        totalRMultiple: { $sum: "$rmultiple" },
        totalRMultipleDifference: { $sum: "$rmultipledifference" },
        holdingPeriods: { $addToSet: "$holdingperiod" },
        strategies: { $addToSet: "$strategy" },
        marketConditions: { $addToSet: "$marketcondition" },
        emotions: { $addToSet: "$emotions" },
        notes: { $addToSet: "$notes" },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        week: "$_id.week",
        totalPnL: 1,
        countTrades: 1,
        winRate: 1,
        lossRate: 1,
        breakevenRate: 1,
        totalFees: 1,
        totalProfit: 1,
        totalPnLPerShare: 1,
        totalReturnPercent: 1,
        totalRRRPlanned: 1,
        totalRMultiple: 1,
        totalRMultipleDifference: 1,
        holdingPeriods: 1,
        strategies: 1,
        marketConditions: 1,
        emotions: 1,
        notes: 1,
      },
    },
  ];

  Trade.aggregate(pipeline)
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    });
};
exports.anotherone = (req, res) => {
  const mongoose = require("mongoose");
  const Trade = require("../models/Trade");

  Trade.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 1,
        user: "$user._id",
        symbol: 1,
        chart: 1,
        outcome: 1,
        action: 1,
        entrydate: 1,
        exitdate: 1,
        entryprice: 1,
        exitprice: 1,
        takeprofit: 1,
        stoploss: 1,
        quantity: 1,
        fees: 1,
        netpnl: 1,
        profit: 1,
        pnlpershare: 1,
        returnpercent: 1,
        timeframe: 1,
        emotions: 1,
        notes: 1,
        marketcondition: 1,
        rrrplanned: 1,
        rmultiple: 1,
        rmultipledifference: 1,
        holdingperiod: 1,
      },
    },
  ])
    .then((result) => {
      console.log(result);
      res.json(result);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    });
};

exports.getTradeStatsByHoldingPeriod = (req, res) => {
  const userId = req.params.userid;

  Trade.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: "$holdingperiod",
        totalTrades: { $sum: 1 },
        winCount: {
          $sum: {
            $cond: [{ $gt: ["$profit", 0] }, 1, 0],
          },
        },
        lossCount: {
          $sum: {
            $cond: [{ $lt: ["$profit", 0] }, 1, 0],
          },
        },
        breakevenCount: {
          $sum: {
            $cond: [{ $eq: ["$profit", 0] }, 1, 0],
          },
        },
        totalProfit: { $sum: "$profit" },
      },
    },
    {
      $project: {
        holdingPeriod: "$_id",
        winRate: {
          $round: [
            { $multiply: [{ $divide: ["$winCount", "$totalTrades"] }, 100] },
            2,
          ],
        },
        lossRate: {
          $round: [
            { $multiply: [{ $divide: ["$lossCount", "$totalTrades"] }, 100] },
            2,
          ],
        },
        breakevenRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$breakevenCount", "$totalTrades"] },
                100,
              ],
            },
            2,
          ],
        },
        totalProfit: 1,
        totalReturn: {
          $round: [
            { $multiply: [{ $divide: ["$totalProfit", "$totalTrades"] }, 100] },
            2,
          ],
        },
        _id: 0,
      },
    },
  ])
    .then((result) => {
      if (result.length === 0) {
        return res.status(404).json({ error: "No trades found" });
      }
      res.json(result[0]);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    });
};

const sort_order = [
  "1 Minute",
  "5 Minutes",
  "15 Minutes",
  "30 Minutes",
  "1 Hour",
  "4 Hours",
  "1 Day",
  "1 Week",
];

exports.bytimeframe = async (req, res) => {
  console.log(req.params.userid);
  try {
    const pipeline = [
      {
        $match: { user: new mongoose.Types.ObjectId(req.params.userid) },
      },
      { $sort: { profit: -1 } },
      {
        $group: {
          _id: "$timeframe",
          symbol: { $push: "$symbol" },
          totalPnL: { $sum: "$netpnl" },
          totalFees: { $sum: "$fees" },
          winRate: {
            $avg: {
              $cond: [{ $gt: ["$netpnl", 0] }, 1, 0],
            },
          },
          lossRate: {
            $avg: {
              $cond: [{ $lt: ["$netpnl", 0] }, 1, 0],
            },
          },
          breakevenRate: {
            $avg: {
              $cond: [{ $eq: ["$netpnl", 0] }, 1, 0],
            },
          },
          // bestperformer: { $push: "$symbol", $push: "$profit" },
          maxReturnPercent: { $max: "$returnpercent" },
          minReturnPercent: { $min: "$returnpercent" },
          averageReturnPercent: { $avg: "$returnpercent" },
          countTrades: { $sum: 1 },
          trades: { $push: "$$ROOT" },
        },
      },
      {
        $addFields: {
          sortOrderIndex: {
            $indexOfArray: [sort_order, "$_id"],
          },
        },
      },
      {
        $sort: {
          sortOrderIndex: 1,
        },
      }, // sort by timeframe in ascending order
      {
        $addFields: {
          symbolCounts: {
            $reduce: {
              input: "$symbol",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  { $arrayToObject: [[{ k: "$$this", v: 1 }]] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          mostTradedSymbol: {
            $let: {
              vars: {
                sortedCounts: { $objectToArray: "$symbolCounts" },
              },
              in: {
                $arrayElemAt: [
                  "$$sortedCounts.k",
                  {
                    $indexOfArray: [
                      "$$sortedCounts.v",
                      { $max: "$$sortedCounts.v" },
                    ],
                  },
                ],
              },
            },
          },
        },
      },

      {
        $project: {
          timeframe: "$_id",
          // trades: 1,
          bestperformingtrades: {
            $map: {
              input: { $slice: ["$trades", 10] },
              as: "trade",
              in: {
                _id: "$$trade._id",
                symbol: "$$trade.symbol",
                entryPrice: "$$trade.entryprice",
                exitPrice: "$$trade.exitprice",
                qty: "$$trade.quantity",
                profit: "$$trade.profit",
                fees: "$$trade.fees",
                timeframe: "$$trade.timeframe",
                marketCondition: "$$trade.marketcondition",
              },
            },
          },

          totalPnL: 1,
          mostTradedSymbol: 1,
          totalFees: 1,
          netprofit: { $subtract: ["$totalPnL", "$totalFees"] },
          winRate: 1,
          lossRate: 1,
          breakevenRate: 1,
          minReturnPercent: 1,
          maxReturnPercent: 1,
          averageReturnPercent: 1,
          countTrades: 1,
          _id: 1,
        },
      },
    ];

    const result = await Trade.aggregate(pipeline);
    const pnlArray = _.map(result, "totalPnL");

    const averageReturnPercent = _.map(result, "averageReturnPercent");
    const labels = _.map(result, "_id");
    const tradecount = _.map(result, "countTrades");

    // const tradecount = _.map(result, "countTrades");
    var colorforchart = colorchartjs(pnlArray, "#2E7D32", "#D32F2F", 0);

    console.log(colorforchart);

    const response = {
      result,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
      color: colorforchart, // set color to the value of colorforchart
    };

    return res.json(response);
  } catch (error) {
    return res.json(error);
  }
};

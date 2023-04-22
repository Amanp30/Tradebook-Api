const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const { extractFields } = require("../helpers/extractfields");
const fs = require("fs");
const formidable = require("formidable");
const form = formidable({ multiples: true });
const _ = require("lodash");
const { colorchartjs } = require("colorchartjs");

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

exports.bytimeframetwo = async (req, res) => {
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
          timeframe: "$_id",
          trades: 1,
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
      {
        $sort: { profit: -1 },
      },
      {
        $project: {
          timeframe: "$_id",
          trades: 1,
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
          bestperformingtrades: 1,
          worstperformingtrades: {
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

    // console.log(colorforchart);

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

exports.bytimeframe = async (req, res) => {
  console.log(req.params.userid);
  try {
    const pipeline = [
      {
        $facet: {
          data: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
              },
            },
            { $sort: { returnpercent: -1, profit: -1 } },
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
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },
                bestTrade: { $first: "$$ROOT" },
                worstTrade: { $last: "$$ROOT" },
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
            // {
            //   $match: {
            //     "trades.profit": { $gt: 0 },
            //   },
            // },
            // {
            //   $project: {
            //     trades: 1,
            //     bestTrades: { $slice: ["$trades", 5] },
            //     worstTrades: { $slice: ["$trades", -5] },
            //   },
            // },
          ],
          bestTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Win",
              },
            },
            { $sort: { returnpercent: -1, profit: -1 } },
            {
              $group: {
                _id: "$timeframe",
                trades: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 2] },
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
            },
          ],
          worstTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Loss",
              },
            },
            { $sort: { returnpercent: 1, profit: 1 } },
            {
              $group: {
                _id: "$timeframe",
                trades: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: 1,
                worstTrades: { $slice: ["$trades", 5] },
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
            },
          ],
        },
      },
    ];
    const result = await Trade.aggregate(pipeline); // perform aggregation
    const data = result[0].data || []; // get data array from aggregation result or use empty array as default

    const pnlArray = data.map((d) => d.totalPnL);
    const orderIndex = data.map((d) => d.sortOrderIndex);
    const averageReturnPercent = data.map((d) => d.averageReturnPercent);
    const labels = data.map((d) => d._id);
    const tradecount = data.map((d) => d.countTrades);

    const color = colorchartjs(pnlArray, "#2E7D32", "#D32F2F", 0); // generate chart color based on pnlArray

    const response = {
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
      color,
    };

    res.json(response); // send response as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" }); // send error response with status code 500
  }
};

exports.bysymbol = async (req, res) => {
  console.log(req.params.userid);
  try {
    const distinctsymbol = await Trade.distinct("symbol", {
      user: req.params.userid,
    });

    console.log(distinctsymbol);

    const pipeline = [
      {
        $facet: {
          data: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
              },
            },
            { $sort: { symbol: 1, returnpercent: -1, profit: -1 } },
            {
              $group: {
                _id: "$symbol",
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
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: { $first: "$$ROOT" },
                worstTrade: { $last: "$$ROOT" },
                trades: { $push: "$$ROOT" },
              },
            },
            { $sort: { _id: 1 } },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [distinctsymbol, "$_id"],
                },
              },
            },
            {
              $sort: {
                sortOrderIndex: 1,
              },
            },
          ],
          bestTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Win",
              },
            },
            { $sort: { returnpercent: -1, profit: -1 } },
            {
              $group: {
                _id: "$symbol",
                trades: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 2] },
              },
            },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [distinctsymbol, "$_id"],
                },
              },
            },
            {
              $sort: {
                sortOrderIndex: 1,
              },
            },
          ],
          worstTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Loss",
              },
            },
            { $sort: { returnpercent: 1, profit: 1 } },
            {
              $group: {
                _id: "$symbol",
                trades: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: 1,
                worstTrades: { $slice: ["$trades", 5] },
              },
            },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [distinctsymbol, "$_id"],
                },
              },
            },
            {
              $sort: {
                sortOrderIndex: 1,
              },
            },
          ],
        },
      },
    ];

    const result = await Trade.aggregate(pipeline); // perform aggregation
    const data = result[0].data || []; // get data array from aggregation result or use empty array as default

    const pnlArray = data.map((d) => d.totalPnL);
    const orderIndex = data.map((d) => d.sortOrderIndex);
    const averageReturnPercent = data.map((d) => d.averageReturnPercent);
    const labels = data.map((d) => d._id);
    const tradecount = data.map((d) => d.countTrades);

    const color = colorchartjs(pnlArray, "#2E7D32", "#D32F2F", 0); // generate chart color based on pnlArray

    const response = {
      result,
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
      color,
    };

    res.json(response); // send response as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" }); // send error response with status code 500
  }
};

// const copyTrade = async (req, res, next) => {
//   try {
//     const originalTrade = await Trade.findById("643f6a0b387db674c9f818bf");

//     const newTrade = new Trade({
//       ...originalTrade.toObject(),
//       _id: undefined, // to create a new document with a new _id
//       symbol: "IPCALAB", // change the symbol field
//     });

//     await newTrade.save();
//     console.log(newTrade);

//     // res
//     //   .status(201)
//     //   .json({ message: "Trade copied successfully", trade: newTrade });
//   } catch (err) {
//     console.error(err);
//     // res.status(500).send("Server Error");
//   }
// };

// copyTrade();

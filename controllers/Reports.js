const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const formidable = require("formidable");
const form = formidable({ multiples: true });
const _ = require("lodash");

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
                bestTrade: {
                  $first: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                worstTrade: {
                  $last: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
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
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 5] },
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
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
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

    const response = {
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
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

    // console.log(distinctsymbol);

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

                bestTrade: {
                  $first: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                worstTrade: {
                  $last: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                  },
                },
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
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 5] },
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
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
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

    const response = {
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
    };

    res.json(response); // send response as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" }); // send error response with status code 500
  }
};

exports.byyearly = async (req, res) => {
  console.log(req.params.userid);
  try {
    const distinctDates = await Trade.distinct("entrydate", {
      user: req.params.userid,
    });

    const distinctYears = [
      ...new Set(distinctDates.map((date) => date.getFullYear())),
    ];

    console.log(distinctYears);

    const pipeline = [
      {
        $facet: {
          data: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
              },
            },
            { $sort: { returnpercent: -1, profit: -1, symbol: 1 } },
            {
              $group: {
                _id: { $year: "$entrydate" },
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

                bestTrade: {
                  $first: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                worstTrade: {
                  $last: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [distinctYears, "$_id"],
                },
              },
            },
            {
              $sort: {
                sortOrderIndex: 1,
              },
            },
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
                _id: { $year: "$entrydate" },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    rmultiple: "$rmultiple",
                    returnpercent: "$returnpercent",
                    entrydate: "$entrydate",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 5] },
              },
            },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [distinctYears, "$_id"],
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
                _id: { $year: "$entrydate" },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    entrydate: "$entrydate",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
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
                  $indexOfArray: [distinctYears, "$_id"],
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

    const response = {
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
    };

    res.json(response); // send response as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" }); // send error response with status code 500
  }
};

exports.bymonthly = async (req, res) => {
  console.log(req.params.userid);
  try {
    const monthnumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const pipeline = [
      {
        $facet: {
          data: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
              },
            },
            { $sort: { returnpercent: -1, profit: -1, symbol: 1 } },
            {
              $group: {
                _id: { $month: "$entrydate" },
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

                bestTrade: {
                  $first: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                worstTrade: {
                  $last: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [monthnumbers, "$_id"],
                },
              },
            },
            {
              $sort: {
                sortOrderIndex: 1,
              },
            },
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
                _id: { $month: "$entrydate" },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    rmultiple: "$rmultiple",
                    returnpercent: "$returnpercent",
                    entrydate: "$entrydate",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 5] },
              },
            },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [monthnumbers, "$_id"],
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
                _id: { $month: "$entrydate" },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    entrydate: "$entrydate",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
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
                  $indexOfArray: [monthnumbers, "$_id"],
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

    const response = {
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
    };

    res.json(response); // send response as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" }); // send error response with status code 500
  }
};

exports.byweekdays = async (req, res) => {
  console.log(req.params.userid);
  try {
    const monthnumbers = [1, 2, 3, 4, 5, 6, 7];

    const pipeline = [
      {
        $facet: {
          data: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
              },
            },
            { $sort: { returnpercent: -1, profit: -1, symbol: 1 } },
            {
              $group: {
                _id: { $dayOfWeek: "$entrydate" },
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

                bestTrade: {
                  $first: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                worstTrade: {
                  $last: {
                    symbol: "$symbol",
                    profit: "$profit",
                    returnpercent: "$returnpercent",
                  },
                },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [monthnumbers, "$_id"],
                },
              },
            },
            {
              $sort: {
                sortOrderIndex: 1,
              },
            },
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
                _id: { $dayOfWeek: "$entrydate" },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    rmultiple: "$rmultiple",
                    returnpercent: "$returnpercent",
                    entrydate: "$entrydate",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                bestTrades: { $slice: ["$trades", 5] },
              },
            },
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [monthnumbers, "$_id"],
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
                _id: { $dayOfWeek: "$entrydate" },
                trades: {
                  $push: {
                    _id: "$_id",
                    symbol: "$symbol",
                    profit: "$profit",
                    quantity: "$quantity",
                    action: "$action",
                    returnpercent: "$returnpercent",
                    entrydate: "$entrydate",
                    rmultiple: "$rmultiple",
                    rrrplanned: "$rrrplanned",
                    netpnl: "$netpnl",
                  },
                },
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
                  $indexOfArray: [monthnumbers, "$_id"],
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

    const response = {
      data,
      bestTrades: result[0].bestTrades,
      worstTrades: result[0].worstTrades,
      orderIndex,
      pnlArray,
      averageReturnPercent,
      labels,
      tradecount,
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
//       symbol: "LT", // change the symbol field
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

const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const _ = require("lodash");
const {
  holdingtimeRange,
  holdingtimearray,
  tradesforreport,
  AddsortOrderIndex,
  ThesortOrderIndexOne,
  TheMostTradedSymbol,
  TheSymbolCounts,
  FirstBestTrade,
  LastWorstTrade,
  TradesWithSymbolProfitQty,
  ProjectWorstTrades,
  ProjectBestTrades,
  AverageWinRate,
  AverageLossRate,
  AverageBreakevenRate,
} = require("../contollers-helpers");

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
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },
                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: tradesforreport,
              },
            },
            AddsortOrderIndex(sort_order),
            ThesortOrderIndexOne, // sort by timeframe in ascending order
            TheSymbolCounts,
            TheMostTradedSymbol,
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
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(sort_order),
            ThesortOrderIndexOne,
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
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(sort_order),
            ThesortOrderIndexOne,
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
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
              },
            },
            { $sort: { _id: 1 } },
            AddsortOrderIndex(distinctsymbol),
            ThesortOrderIndexOne,
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
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(distinctsymbol),
            ThesortOrderIndexOne,
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
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(distinctsymbol),
            ThesortOrderIndexOne,
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
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
              },
            },
            { $sort: { _id: 1 } },
            AddsortOrderIndex(distinctYears),
            ThesortOrderIndexOne,
            TheSymbolCounts,
            TheMostTradedSymbol,
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
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(distinctYears),
            ThesortOrderIndexOne,
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
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(distinctYears),
            ThesortOrderIndexOne,
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
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
              },
            },
            { $sort: { _id: 1 } },
            AddsortOrderIndex(monthnumbers),
            ThesortOrderIndexOne,
            TheSymbolCounts,
            TheMostTradedSymbol,
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
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(monthnumbers),
            ThesortOrderIndexOne,
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
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(monthnumbers),
            ThesortOrderIndexOne,
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
    const WeekDays = [1, 2, 3, 4, 5, 6, 7];

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
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
              },
            },
            { $sort: { _id: 1 } },
            AddsortOrderIndex(WeekDays),
            ThesortOrderIndexOne,
            TheSymbolCounts,
            TheMostTradedSymbol,
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
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(WeekDays),
            ThesortOrderIndexOne,
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
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(WeekDays),
            ThesortOrderIndexOne,
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

exports.byvolumes = async (req, res) => {
  console.log(req.params.userid);
  try {
    const volumesOrder = [
      "0-100",
      "100-1000",
      "1K-50K",
      "50K-1Lac",
      "more than 1 Lac",
    ];
    const quantityRange = [
      { case: { $lte: ["$quantity", 100] }, then: "0-100" },
      { case: { $lte: ["$quantity", 1000] }, then: "100-1000" },
      { case: { $lte: ["$quantity", 50000] }, then: "1K-50K" },
      { case: { $lte: ["$quantity", 100000] }, then: "50K-1Lac" },
      { case: { $gt: ["$quantity", 100000] }, then: "more than 1 Lac" },
    ];

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
                _id: {
                  $switch: {
                    branches: quantityRange,
                    default: "Unknown",
                  },
                },
                symbol: { $push: "$symbol" },
                totalPnL: { $sum: "$netpnl" },
                totalFees: { $sum: "$fees" },
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
              },
            },
            { $sort: { _id: 1 } },
            AddsortOrderIndex(volumesOrder),
            ThesortOrderIndexOne,
            TheSymbolCounts,
            TheMostTradedSymbol,
          ],
          bestTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Win",
              },
            },
            { $sort: { returnpercent: -1, profit: -1, quantity: -1 } },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: quantityRange,
                    default: "Unknown",
                  },
                },
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(volumesOrder),
            ThesortOrderIndexOne,
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
                _id: {
                  $switch: {
                    branches: quantityRange,
                    default: "Unknown",
                  },
                },
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(volumesOrder),
            ThesortOrderIndexOne,
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

exports.byhourly = async (req, res) => {
  console.log(req.params.userid);
  try {
    const monthnumbers = [
      "0-100",
      "100-1000",
      "1K-50K",
      "50K-1Lac",
      "more than 1 Lac",
    ];
    const quantityRange = [
      { case: { $lte: ["$quantity", 100] }, then: "0-100" },
      { case: { $lte: ["$quantity", 1000] }, then: "100-1000" },
      { case: { $lte: ["$quantity", 50000] }, then: "1K-50K" },
      { case: { $lte: ["$quantity", 100000] }, then: "50K-1Lac" },
      { case: { $gt: ["$quantity", 100000] }, then: "more than 1 Lac" },
    ];

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
                _id: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%H:00",
                        date: "$entrydate",
                      },
                    },
                    "-",
                    {
                      $dateToString: {
                        format: "%H:00",
                        date: "$exitdate",
                      },
                    },
                  ],
                },
                symbol: { $push: "$symbol" },
                totalPnL: { $sum: "$netpnl" },
                totalFees: { $sum: "$fees" },
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
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
            ThesortOrderIndexOne,
            TheSymbolCounts,
            TheMostTradedSymbol,
          ],
          bestTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Win",
              },
            },
            { $sort: { returnpercent: -1, profit: -1, quantity: -1 } },
            {
              $group: {
                _id: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%H:00",
                        date: "$entrydate",
                      },
                    },
                    "-",
                    {
                      $dateToString: {
                        format: "%H:00",
                        date: "$exitdate",
                      },
                    },
                  ],
                },
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [monthnumbers, "$_id"],
                },
              },
            },
            ThesortOrderIndexOne,
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
                _id: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%H:00",
                        date: "$entrydate",
                      },
                    },
                    "-",
                    {
                      $dateToString: {
                        format: "%H:00",
                        date: "$exitdate",
                      },
                    },
                  ],
                },
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            {
              $addFields: {
                sortOrderIndex: {
                  $indexOfArray: [monthnumbers, "$_id"],
                },
              },
            },
            ThesortOrderIndexOne,
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

exports.calendarReport = async (req, res) => {
  const currentYear = new Date().getFullYear(); // get current year
  const startDate = new Date(currentYear, 0, 1); // create start date for current year (January 1st)
  const endDate = new Date(currentYear, 11, 31);

  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.params.userid),
        entrydate: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$entrydate" } },
        profitinrs: { $sum: "$profit" },
        fees: { $sum: "$fees" },
        tradecount: { $sum: 1 },
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
        trades: {
          $push: {
            _id: "$_id",
            symbol: "$symbol",
            action: "$action",
            profit: "$profit",
            quantity: "$quantity",
            outcome: "$outcome",
            entryprice: "$entryprice",
            exitprice: "$exitprice",
            entrydate: "$entrydate",
            exitdate: "$exitdate",
            timeframe: "$timeframe",
            returnpercent: "$returnpercent",
          },
        },
      },
    },
  ];

  var result = await Trade.aggregate(pipeline);

  const totalfeespaid = _.sumBy(result, "fees");
  const totalprofit = _.sumBy(result, "profitinrs");
  const thenetpnl = totalprofit - totalfeespaid;
  const tradestaken = _.sumBy(result, "tradecount");

  const numTrades = result.length;
  const numWins = _.sumBy(result, (trade) => trade.profitinrs > 0);
  const numLosses = _.sumBy(result, (trade) => trade.profitinrs < 0);

  const winRate = ((numWins / numTrades) * 100).toFixed(0);
  const lossRate = ((numLosses / numTrades) * 100).toFixed(0);

  const response = {
    result,
    winRate,
    lossRate,
    totalfeespaid,
    totalprofit,
    thenetpnl,
    tradestaken,
  };

  res.json(response);
};

exports.byholdingtime = async (req, res) => {
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
            { $sort: { returnpercent: -1, profit: -1, symbol: 1 } },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: holdingtimeRange,
                    default: "Unknown",
                  },
                },
                symbol: { $push: "$symbol" },
                totalPnL: { $sum: "$netpnl" },
                totalFees: { $sum: "$fees" },
                winRate: AverageWinRate,
                lossRate: AverageLossRate,
                breakevenRate: AverageBreakevenRate,
                maxReturnPercent: { $max: "$returnpercent" },
                minReturnPercent: { $min: "$returnpercent" },
                averageReturnPercent: { $avg: "$returnpercent" },
                countTrades: { $sum: 1 },

                bestTrade: FirstBestTrade,
                worstTrade: LastWorstTrade,
                trades: TradesWithSymbolProfitQty,
              },
            },
            { $sort: { _id: 1 } },
            AddsortOrderIndex(holdingtimearray),
            ThesortOrderIndexOne,
            TheSymbolCounts,
            TheMostTradedSymbol,
          ],
          bestTrades: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.params.userid),
                outcome: "Win",
              },
            },
            { $sort: { returnpercent: -1, profit: -1, quantity: -1 } },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: holdingtimeRange,
                    default: "Unknown",
                  },
                },
                trades: tradesforreport,
              },
            },
            ProjectBestTrades,
            AddsortOrderIndex(holdingtimearray),
            ThesortOrderIndexOne,
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
                _id: {
                  $switch: {
                    branches: holdingtimeRange,
                    default: "Unknown",
                  },
                },
                trades: tradesforreport,
              },
            },
            ProjectWorstTrades,
            AddsortOrderIndex(holdingtimearray),
            ThesortOrderIndexOne,
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
//     const originalTrade = await Trade.findById("646501721e2e66f38aede273");

//     const newTrade = new Trade({
//       ...originalTrade.toObject(),
//       _id: undefined, // to create a new document with a new _id
//       symbol: "AXISBANK", // change the symbol field
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

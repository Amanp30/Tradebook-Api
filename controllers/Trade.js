const Trade = require("../models/Trade");
const Tradingsystem = require("../models/Tradingsystem");
const { extractFields } = require("../helpers/extractfields");
const fs = require("fs");
const _ = require("lodash");
const mongoose = require("mongoose");
const formidable = require("formidable");
const { fileCopy } = require("../helpers/filecopy");
const form = formidable({ multiples: true });

console.log(Trade);

exports.addTrade = async (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(409).json({ message: "Error parsing form data." });
    }

    console.log(typeof files.chart);
    // Handle the file upload

    if (typeof files.chart === "object") {
      const oldPath = files.chart?.filepath;
      const filename =
        fields.user + "-" + Date.now() + "-" + files.chart.originalFilename;
      const newPath = `./uploads/${filename}`;

      var isSaved = await fileCopy(oldPath, newPath);
      if (isSaved) {
        try {
          const newTrade = new Trade({
            ...fields,
            chart: filename,
          });
          await newTrade.validate(); // Validate the trade object

          newTrade.save();
          return res.status(201).json({
            message: "Trade added successfully.",
            data: newTrade,
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: "Error saving trade." });
        }
      }
    } else {
      try {
        const newTrade = new Trade({
          ...fields,
        });

        await newTrade.validate(); // Validate the trade object

        newTrade.save();
        return res.status(201).json({
          message: "Trade added successfully.",
          data: newTrade,
        });
      } catch (error) {
        if (error.name === "ValidationError") {
          // Handle validation errors
          const validationErrors = Object.values(error.errors).map((error) => {
            return error.message;
          });

          return res.status(409).json({ message: validationErrors });
        } else {
          // Handle other Mongoose errors
          // console.error(error);
          return res.status(500).json({ message: "Error saving trade." });
        }
      }
    }
  });
};

exports.DistinctSymbols = async (req, res) => {
  const { userid } = req.params;
  try {
    const symbols = await Trade.distinct("symbol", {
      user: new mongoose.Types.ObjectId(userid),
    });
    const system = await Tradingsystem.find({
      user: new mongoose.Types.ObjectId(userid),
    }).select("_id systemname");

    const systemIds = _.map(system, "_id");
    const systemNames = _.map(system, "systemname");

    console.log(system);
    return res.status(200).json({ symbols, systemIds, systemNames });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching symbols." });
  }
};

exports.showtrades = async (req, res) => {
  try {
    const userid = req.params.userid;
    const trades = await Trade.find({ user: userid })
      .sort({ entrydate: -1 })
      .limit(20);
    return res.status(200).json({ trades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching trades." });
  }
};

console.log("stat her s");
exports.paginateTrades = async (req, res) => {
  try {
    const userid = req.params.userid;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 5;
    console.log("page " + page);
    console.log("per page  " + perPage);

    const totalTrades = await Trade.countDocuments({ user: userid });
    const trades = await Trade.find({
      user: new mongoose.Types.ObjectId(userid),
    })
      .sort({ entrydate: 1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(totalTrades / perPage);

    const data = {
      currentPage: page,
      totalTrades: totalTrades,
      totalPageCount: totalPages,
      trades: trades,
    };
    // console.log(data);

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching trades." });
  }
};

exports.editTrade = async (req, res) => {
  try {
    const tradeid = req.params.tradeid;
    const userid = req.params.userid;
    const trade = await Trade.find({ _id: tradeid, user: userid });
    return res.status(200).json(trade);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching trades" });
  }
};

exports.oneTradeview = async (req, res) => {
  try {
    const tradeid = req.params.tradeid;
    const userid = req.params.userid;
    const trade = await Trade.find({ _id: tradeid, user: userid }).populate(
      "tradingsystem"
    );
    return res.status(200).json(trade);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching trades" });
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const tradeid = req.params.tradeid;
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error parsing form data." });
      }
      const trade = await Trade.findById(tradeid);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found." });
      }

      var isSaved;

      //   console.log(files?.chart);
      if (fields.chart === "" && trade.chart !== "") {
        // Delete the chart file
        fs.unlink(`uploads/${trade.chart}`, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Successfully deleted : ${trade.chart}`);
          }
        });
      }

      if (files.chart && typeof files.chart === "object") {
        const oldPath = files.chart?.filepath;
        const filename =
          trade.user + "-" + Date.now() + "-" + files.chart.originalFilename;
        const newPath = `./uploads/${filename}`;
        isSaved = await fileCopy(oldPath, newPath);
        fields.chart = filename;

        if (trade.chart !== "") {
          fs.unlink(`uploads/${trade.chart}`, (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log(`Successfully deleted: ${trade.chart}`);
            }
          });
          isSaved = true;
        }
      }

      const updatedTrade = await Trade.findByIdAndUpdate(tradeid, fields, {
        new: true,
      });
      return res.status(200).json(updatedTrade);
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating trade." });
  }
};

exports.deleteTradeById = async (req, res) => {
  try {
    const tradeId = req.params.tradeid;

    const { chart } = await Trade.findById(tradeId);

    if (chart !== "" && typeof chart !== "undefined") {
      fs.unlink(`uploads/${chart}`, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Successfully deleted: ${chart}`);
        }
      });
    }

    const trade = await Trade.findByIdAndDelete(tradeId);
    if (!trade) {
      return res.status(409).json({ message: "Trade not found" });
    }
    return res.status(200).json({ message: "Trade deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error deleting trade" });
  }
};

exports.saveNewNamesofSymbols = async (req, res) => {
  try {
    const { userid } = req.params;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
      }

      // console.log(fields);
      // Update all trades with the given user ID and symbol
      const updateResult = await Trade.updateMany(
        { user: userid, symbol: fields.symbol },
        { $set: { symbol: fields.newSymbol } }
      );

      // throw new Error("Something went wrong");
      // Check if any trades were updated
      if (updateResult) {
        return res.json({
          message: `Symbol updated`,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update trades", error });
  }
};

exports.addNote = async (req, res) => {
  const { tradeid } = req.params;
  form.parse(req, async (err, fields) => {
    if (err) {
      return res.status(500).send(err);
    }
    const { note } = fields;
    console.log(fields);
    try {
      const trade = await Trade.findById(tradeid);

      if (!trade) {
        return res.status(404).send("Trade not found");
      }

      trade.notes.push(note);
      const updatedTrade = await trade.save();
      // console.log(updatedTrade.notes);
      res
        .status(201)
        .json({ message: "Note Added", notes: updatedTrade.notes });
    } catch (err) {
      res.status(500).send(err);
    }
  });
};

exports.deleteNote = async (req, res) => {
  const { tradeid } = req.params;
  form.parse(req, async (err, fields) => {
    if (err) {
      return res.status(500).send(err);
    }
    const noteIndex = fields.index;
    console.log(fields);
    try {
      const trade = await Trade.findById(tradeid);

      if (!trade) {
        return res.status(404).send("Trade not found");
      }

      trade.notes.splice(noteIndex, 1);
      const updatedTrade = await trade.save();
      // console.log(updatedTrade.notes);
      res
        .status(201)
        .json({ message: "Note deleted", notes: updatedTrade.notes });
    } catch (err) {
      res.status(500).send(err);
    }
  });
};

exports.updateNote = async (req, res) => {
  const { tradeid } = req.params;
  form.parse(req, async (err, fields) => {
    if (err) {
      return res.status(500).send(err);
    }
    const noteIndex = fields.noteindex;
    const note = fields.note;
    console.log(fields);
    try {
      const trade = await Trade.findById(tradeid);

      if (!trade) {
        return res.status(404).send("Trade not found");
      }

      trade.notes[noteIndex] = note;
      const updatedTrade = await trade.save();
      console.log(updatedTrade.notes);
      res
        .status(201)
        .json({ message: "Note Updated", notes: updatedTrade.notes });
    } catch (err) {
      res.status(500).send(err);
    }
  });
};

exports.dashboardtradesreport = async (req, res) => {
  const { userid } = req.params;

  try {
    const pipeline = [
      {
        $facet: {
          topmonth: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(userid),
              },
            },
            {
              $sort: {
                profit: -1,
              },
            },
            {
              $group: {
                _id: {
                  $month: {
                    date: "$entrydate",
                  },
                },
                tradecount: {
                  $sum: 1,
                },
                avgreturnpercent: {
                  $avg: "$returnpercent",
                },
                winCount: {
                  $sum: {
                    $cond: [
                      {
                        $gt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lossCount: {
                  $sum: {
                    $cond: [
                      {
                        $lt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalnetpnl: {
                  $sum: "$netpnl",
                },
              },
            },
            {
              $project: {
                _id: 1,
                data: 1,
                tradecount: 1,
                avgreturnpercent: 1,
                winRate: {
                  $multiply: [
                    {
                      $divide: ["$winCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                lossRate: {
                  $multiply: [
                    {
                      $divide: ["$lossCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                totalnetpnl: 1,
              },
            },
            {
              $sort: {
                totalnetpnl: -1,
              },
            },
            {
              $limit: 5,
            },
          ],
          topyear: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(userid),
              },
            },
            {
              $sort: {
                profit: -1,
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y",
                    date: "$entrydate",
                  },
                },
                tradecount: {
                  $sum: 1,
                },
                avgreturnpercent: {
                  $avg: "$returnpercent",
                },
                winCount: {
                  $sum: {
                    $cond: [
                      {
                        $gt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lossCount: {
                  $sum: {
                    $cond: [
                      {
                        $lt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalnetpnl: {
                  $sum: "$netpnl",
                },
              },
            },
            {
              $project: {
                _id: 1,
                data: 1,
                tradecount: 1,
                avgreturnpercent: 1,
                winRate: {
                  $multiply: [
                    {
                      $divide: ["$winCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                lossRate: {
                  $multiply: [
                    {
                      $divide: ["$lossCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                totalnetpnl: 1,
              },
            },
            {
              $sort: {
                totalnetpnl: -1,
              },
            },
            {
              $limit: 5,
            },
          ],
          topweekday: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(userid),
              },
            },
            {
              $sort: {
                profit: -1,
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%w",
                    date: "$entrydate",
                  },
                },
                tradecount: {
                  $sum: 1,
                },
                avgreturnpercent: {
                  $avg: "$returnpercent",
                },
                winCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lossCount: {
                  $sum: {
                    $cond: [
                      {
                        $lt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalnetpnl: {
                  $sum: "$netpnl",
                },
              },
            },
            {
              $project: {
                _id: 1,
                data: 1,
                tradecount: 1,
                avgreturnpercent: 1,
                winRate: {
                  $multiply: [
                    {
                      $divide: ["$winCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                lossRate: {
                  $multiply: [
                    {
                      $divide: ["$lossCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                totalnetpnl: 1,
              },
            },
            {
              $sort: {
                totalnetpnl: -1,
              },
            },
            {
              $limit: 5,
            },
          ],
          topsymbol: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(userid),
              },
            },
            {
              $sort: {
                profit: -1,
              },
            },
            {
              $group: {
                _id: "$symbol",
                tradecount: {
                  $sum: 1,
                },
                avgreturnpercent: {
                  $avg: "$returnpercent",
                },
                winCount: {
                  $sum: {
                    $cond: [
                      {
                        $gt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lossCount: {
                  $sum: {
                    $cond: [
                      {
                        $lt: ["$netpnl", 0],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalnetpnl: {
                  $sum: "$netpnl",
                },
              },
            },
            {
              $project: {
                _id: 1,
                data: 1,
                tradecount: 1,
                avgreturnpercent: 1,
                winRate: {
                  $multiply: [
                    {
                      $divide: ["$winCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                lossRate: {
                  $multiply: [
                    {
                      $divide: ["$lossCount", "$tradecount"],
                    },
                    100,
                  ],
                },
                totalnetpnl: 1,
              },
            },
            {
              $sort: {
                totalnetpnl: -1,
              },
            },
            {
              $limit: 5,
            },
          ],
          chartdata: [
            {
              $match: {
                user: new mongoose.Types.ObjectId(userid),
              },
            },
            {
              $group: {
                _id: null,
                profitarray: { $push: "$profit" },
                netpnlarray: { $push: "$netpnl" },
                symbols: { $push: "$symbol" },
                totalprofit: { $sum: "$profit" },
                totalfeespaid: { $sum: "$fees" },
                totalnetpnl: { $sum: "$netpnl" },
              },
            },
          ],
        },
      },
    ];

    const result = await Trade.aggregate(pipeline); // perform aggregation

    res.json(result[0]);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

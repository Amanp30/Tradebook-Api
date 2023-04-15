const Trade = require("../models/Trade");
const { extractFields } = require("../helpers/extractfields");
const fs = require("fs");
const checkBeforeDelete = require("../helpers/checkbeforedelete");
const formidable = require("formidable");
const { fileCopy } = require("../helpers/filecopy");
const form = formidable({ multiples: true });

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
        // Create a new Trade instance
        const newTrade = new Trade({
          ...fields,
          chart: filename,
        });

        // Save the Trade to the database
        try {
          newTrade.save();
          return res.status(201).json({
            message: "Trade added successfully.f",
            data: newTrade,
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: "Error saving trade." });
        }
      }
    } else {
      const newTrade = new Trade({
        ...fields,
      });

      // Save the Trade to the database
      try {
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
  });
};

exports.DistinctSymbols = async (req, res) => {
  try {
    const symbols = await Trade.distinct("symbol");
    return res.status(200).json({ symbols });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching symbols." });
  }
};

exports.showtrades = async (req, res) => {
  try {
    const userid = req.params.userid;
    const trades = await Trade.find({ user: userid }).sort({ entrydate: -1 });
    return res.status(200).json({ trades });
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
    return res.status(500).json({ message: "Error fetching trades." });
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

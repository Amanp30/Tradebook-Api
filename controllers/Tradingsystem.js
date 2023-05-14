const mongoose = require("mongoose");
const Tradingsystem = require("../models/Tradingsystem");
const formidable = require("formidable");
const form = formidable({ multiples: true });
const _ = require("lodash");

exports.newTradingsystem = async (req, res) => {
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Could not parse form data" });
    }

    console.log(fields);
    // Validate the input fields
    if (!fields.tradingsystem || !fields.systemname) {
      return res
        .status(409)
        .json({ message: "System Name and system is required" });
    }

    // Create a new Tradingsystem object with the input data
    const mynewsystem = new Tradingsystem({
      tradingsystem: fields.tradingsystem,
      user: req.params.userid,
      systemname: fields.systemname,
    });

    try {
      // Save the new Tradingsystem to the database
      var data = await mynewsystem.save();
      console.log(data);

      res.status(200).json({ data, message: "New system added." });
    } catch (error) {
      res.status(500).json({ message: "Could not create Tradingsystem" });
    }
  });
};

exports.getTradingsystems = async (req, res) => {
  console.log(req.params.userid);

  try {
    const foundTradingsystem = await Tradingsystem.find({
      user: new mongoose.Types.ObjectId(req.params.userid),
    });

    if (!foundTradingsystem) {
      return res.status(404).json({ message: "Trading Systems not found" });
    }

    console.log(foundTradingsystem);
    res.json(foundTradingsystem);
  } catch (error) {
    res.status(500).json({ message: "Could not retrieve Trading Systems" });
  }
};

exports.viewSystem = async (req, res) => {
  console.log(req.params.userid);

  try {
    const foundTradingsystem = await Tradingsystem.find({
      user: new mongoose.Types.ObjectId(req.params.userid),
      _id: req.params.systemid,
    });

    if (!foundTradingsystem) {
      return res.status(404).json({ message: "Tradingsystem not found" });
    }

    console.log(foundTradingsystem);
    res.json(foundTradingsystem);
  } catch (error) {
    res.status(500).json({ message: "Could not retrieve Tradingsystem" });
  }
};

exports.updateTradingsystem = async (req, res) => {
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ message: "Could not parse form data" });
    }

    console.log(fields);
    // Validate the input fields
    if (!fields.tradingsystem || !fields.systemname) {
      return res
        .status(409)
        .json({ message: "System Name and system is required" });
    }

    try {
      // Find the TradingSystem object with the given userid and systemid
      const mysystem = await Tradingsystem.findOne({
        user: new mongoose.Types.ObjectId(req.params.userid),
        _id: req.params.systemid,
      });

      if (!mysystem) {
        return res.status(404).json({ message: "Trading system not found" });
      }

      // Update the TradingSystem object with the new input data
      mysystem.tradingsystem = fields.tradingsystem;
      mysystem.systemname = fields.systemname;

      // Save the updated TradingSystem to the database
      const updatedSystem = await mysystem.save();
      console.log(updatedSystem);

      res.status(200).json({ data: updatedSystem, message: "System updated." });
    } catch (error) {
      res.status(500).json({ message: "Could not update TradingSystem" });
    }
  });
};

exports.deleteTradingsystem = async (req, res) => {
  try {
    // Find and delete the TradingSystem object with the given userid and systemid
    const deletedSystem = await Tradingsystem.findOneAndDelete({
      user: req.params.userid,
      _id: req.params.systemid,
    });

    if (!deletedSystem) {
      return res.status(404).json({ message: "Trading system not found" });
    }

    res.status(200).json({ message: "System deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete Trading System" });
  }
};

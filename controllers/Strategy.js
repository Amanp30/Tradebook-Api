const mongoose = require("mongoose");
const Strategy = require("../models/Strategy");
const formidable = require("formidable");
const form = formidable({ multiples: true });
const _ = require("lodash");

exports.newStrategy = async (req, res) => {
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Could not parse form data" });
    }

    console.log(fields);
    // Validate the input fields

    // Create a new Strategy object with the input data
    const strategy = new Strategy({
      strategy: fields.strategy,
      user: req.params.userid,
    });

    try {
      // Save the new strategy to the database
      var savedStrategy = await strategy.save();
      console.log(savedStrategy);

      res.json({
        data: savedStrategy,
      });
    } catch (error) {
      res.status(500).json({ error: "Could not create strategy" });
    }
  });
};

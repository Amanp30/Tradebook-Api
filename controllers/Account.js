const express = require("express");
const User = require("../models/User");
const formidable = require("formidable");
const form = formidable({ multiples: true });

exports.getUserData = async (req, res) => {
  try {
    const user = await User.findOne(
      { _id: req.params.userid },
      "firstname lastname state broker mobileno"
    );
    if (!user) {
      return res.status(409).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.saveUserData = async (req, res, next) => {
  try {
    const userId = req.params.userid;

    form.parse(req, async (err, fields) => {
      if (err) {
        return res.status(400).json({ message: "Unable to parse form data" });
      }

      const result = await User.findByIdAndUpdate(userId, fields, {
        new: true,
      });

      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ broker: result.broker });
    });
  } catch (err) {
    next(err);
  }
};

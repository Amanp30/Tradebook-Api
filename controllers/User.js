const User = require("../models/User");
const Tradingsystem = require("../models/Tradingsystem");
const Jwtoken = require("jsonwebtoken");
const _ = require("lodash");
const mongoose = require("mongoose");
const formidable = require("formidable");
const { extractFields } = require("../helpers/extractfields");
const form = formidable({ multiples: true });

// sendgrid
// const sgMail = require("@sendgrid/mail"); // SENDGRID_API_KEY
// sgMail.setApiKey(process.env.SENDGRID_KEY);

exports.addnew = async (req, res) => {
  try {
    // throw new Error("Testing error 500");

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res.status(409).send({ message: "Error parsing form data" });
      console.log(fields.email);

      const existingUser = await User.findOne({ email: fields.email });
      if (existingUser) {
        return res.status(409).send({ message: "Email already exists" });
      } else {
        const user = new User({
          // firstname: fields.firstname,
          // lastname: fields.lastname,
          email: fields.email,
          password: fields.password,
        });
        const savedUser = await user.save();
        console.log(savedUser);

        const system = new Tradingsystem({
          systemname: "Default System",
          tradingsystem: "<p>Edit system details</p>",
          user: new mongoose.Types.ObjectId(savedUser._id),
        });
        const savedsystem = await system.save();

        if (savedsystem) {
          return res.status(201).send({ success: "Account created" });
        } else {
          return res.status(409).send({ message: "There are some error" });
        }
      }
    });
  } catch (err) {
    return res.status(500).send({ message: "Internal server error" });
  }
};

exports.signin = (req, res) => {
  form.parse(req, (err, fields) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }

    const { email, password } = fields;
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          return res.status(409).json({
            message: "User with this email does not exist! Please signup",
          });
        }

        if (!user.authenticate(password)) {
          return res.status(409).json({
            message: "Email and password does not match",
          });
        }

        const token = Jwtoken.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });
        res.cookie("token", token, { expiresIn: "1d" });
        const { _id, email, broker } = user;
        return res.json({
          token,
          user: _id,
          email,
          broker: broker ? broker : "",
        });
      })
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Sighout Success" });
};

exports.forgotPassword = async (req, res) => {
  try {
    form.parse(req, async (error, fields, files) => {
      if (error) {
        console.error(error);
        return res.status(409).json({
          message: "Error in processing form data",
        });
      }

      const { email } = fields;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(409).json({
          message: "User with that email does not exist",
        });
      }

      const token = Jwtoken.sign(
        { _id: user._id },
        process.env.JWT_RESET_PASSWORD,
        {
          expiresIn: "10m",
        }
      );

      const emailData = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: `Password reset link`,
        html: `
          <p>Please use the following link to reset your password:</p>
          <p>${process.env.CLIENT_URL}/auth/reset/${token}</p>
          <hr />
          <p>This email may contain sensetive information</p>
          <p>https://seoblog.com</p>
        `,
      };

      console.log(emailData);

      await user.updateOne({ resetPasswordLink: token });
      // await sgMail.send(emailData);

      return res.json({
        success: "Email Sent successfully",
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    form.parse(req, async (error, fields) => {
      if (error) {
        return res.status(409).json({ error: "Error parsing form data" });
      }

      const token = req.params.link;
      const { password } = fields;

      if (!token) {
        return res.status(409).json({ message: "No token provided" });
      }

      let decodedToken;
      try {
        decodedToken = Jwtoken.verify(token, process.env.JWT_RESET_PASSWORD);
      } catch (err) {
        console.log(err);
        return res.status(409).json({ message: "Invalid or expired token" });
      }

      // Continue with resetting the password

      const user = await User.findOne({ resetPasswordLink: token });
      if (!user) {
        return res.status(409).json({ message: "Invalid link. Try again" });
      }

      // Check if the link has expired
      const currentTime = new Date().getTime();

      if (decodedToken.exp * 1000 < currentTime) {
        return res.status(409).json({ message: "Link has expired. Try again" });
      }

      // Update user's password
      user.password = password;
      user.resetPasswordLink = "";
      await user.save();

      return res.json({
        success: "Great! Now you can login with your new password",
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

exports.helloji = (req, res) => {
  var extractdata = [
    "symbol",
    "action",
    "entrydate",
    "exitdate",
    "entryprice",
    "exitprice",
    "quantity",
    "fees",
    "netpnl",
    "profit",
    "pnlpershare",
    "returnpercent",
    "timeframe",
    "emotions",
    "tradetype",
    "exchange",
    "strategy",
    "notes",
    "turnover",
    "ordertype",
    "marketcondition",
    "riskrewardratio",
    "holdingperiod",
  ];
  const data = extractFields(req.body, extractdata);

  console.log(data);
  res.send(data);
};

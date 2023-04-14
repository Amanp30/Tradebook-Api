const path = require("path");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 9000;

//bringing router
const userRoutes = require("./routes/User");
const tradeRoutes = require("./routes/Trades");

//app

const app = express();

app.use("/uploads", express.static("uploads"));

//database
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

//middlewares

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

//route middlewares
app.use("/api", userRoutes);
app.use("/api", tradeRoutes);

//cors
const corsOptions = {
  // origin: "http://localhost:3000", // set your desired origins or allow any origin with *
  origin: "*", // set your desired origins or allow any origin with *
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));

// error handling middleware

app.use((req, res, next) => {
  res.status(404).send({ message: "Requested data not found" });
});

//port
app.listen(port, () => {
  console.log(`Server started at ${port}`);
});

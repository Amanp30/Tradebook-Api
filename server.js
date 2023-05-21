const path = require("path");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 9000;
const Allowedurl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://testing-react-js-xi.vercel.app";

//bringing router
const userRoutes = require("./routes/User");
const tradeRoutes = require("./routes/Trades");
const accountRoutes = require("./routes/Account");
const reportRoutes = require("./routes/Reports");
const tradingsystemRoutes = require("./routes/Tradingsystem");
const { requireSignin } = require("./validators/jwtvalidator");

//app

const app = express();

app.use("/uploads", express.static("uploads"));

const localuri = "mongodb://0.0.0.0:27017/tradeapp";
const databaseuri = process.env.DATABASE;

//database
mongoose
  .connect(process.env.NODE_ENV !== "production" ? localuri : databaseuri, {
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
  res.header("Access-Control-Allow-Origin", Allowedurl);
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// app.use(requireSignin, {
//   unless: [
//     "/user/forgotpassword",
//     "/user/reset/:link",
//     "/user/login",
//     "/user/signup",
//   ],
// });

//route middlewares
app.use("/api", userRoutes);
app.use("/api", tradeRoutes);
app.use("/api", accountRoutes);
app.use("/api", reportRoutes);
app.use("/api", tradingsystemRoutes);

//cors
const corsOptions = {
  origin: Allowedurl, // set your desired origins or allow any origin with *
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

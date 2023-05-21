const db = require("./db");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const {
  corsOptions,
  crossOriginResourceSharing,
  handleNotFound,
} = require("./helpers/essentialfunc");
const port = process.env.PORT || 9000;

//bringing router
const userRoutes = require("./routes/User");
const tradeRoutes = require("./routes/Trades");
const accountRoutes = require("./routes/Account");
const reportRoutes = require("./routes/Reports");
const tradingsystemRoutes = require("./routes/Tradingsystem");

const app = express();

app.use("/uploads", express.static("uploads"));

//middlewares
app.use(morgan("dev")); // logs routes in console
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(crossOriginResourceSharing);
app.use(cors(corsOptions));

//route here
app.use("/api", userRoutes);
app.use("/api", tradeRoutes);
app.use("/api", accountRoutes);
app.use("/api", reportRoutes);
app.use("/api", tradingsystemRoutes);

// this handles 404 error it must be here
app.use(handleNotFound);

//port
app.listen(port, () => {
  console.log(`Server started at ${port}`);
});

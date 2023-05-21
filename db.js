const mongoose = require("mongoose");
const { DATABASEURI, NODE_ENV } = require("./configvar");

const localuri = "mongodb://0.0.0.0:27017/tradeapp";

//database
mongoose
  .connect(NODE_ENV !== "production" ? localuri : DATABASEURI, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

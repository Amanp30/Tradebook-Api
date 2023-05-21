const mongoose = require("mongoose");

const localuri = "mongodb://0.0.0.0:27017/tradeapp";
const databaseuri = process.env.DATABASE;

//database
mongoose
  .connect(process.env.NODE_ENV !== "production" ? localuri : databaseuri, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

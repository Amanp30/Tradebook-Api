const mongoose = require("mongoose");
const { DATABASEURI, NODE_ENV, LOCAL_DATABASE } = require("./configvar");

//database
mongoose
  .connect(NODE_ENV !== "production" ? LOCAL_DATABASE : DATABASEURI, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

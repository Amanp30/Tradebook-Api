const { NODE_ENV, DEV_CLIENT_URL, PROD_CLIENT_URL } = require("../configvar");

const Allowedurl =
  NODE_ENV !== "production"
    ? DEV_CLIENT_URL
    : PROD_CLIENT_URL;

exports.corsOptions = {
  origin: Allowedurl, // set your desired origins or allow any origin with *
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

exports.crossOriginResourceSharing = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", Allowedurl);
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
};

exports.handleNotFound = (req, res, next) => {
  res.status(404).send({ message: "Requested data not found" });
};

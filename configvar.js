require("dotenv").config();

exports.NODE_ENV = process?.env?.NODE_ENV;
exports.APP_PORT = process?.env?.PORT;
exports.DATABASEURI = process?.env?.DATABASE;
exports.LOCAL_DATABASE = process?.env?.LOCAL_DATABASE;
exports.DEV_CLIENT_URL = process?.env?.DEV_CLIENT_URL;
exports.PROD_CLIENT_URL = process?.env?.PROD_CLIENT_URL;

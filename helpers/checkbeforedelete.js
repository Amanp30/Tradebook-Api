const fs = require("fs");

exports.checkBeforeDelete = async function (filePath) {
  try {
    // Check if file exists
    await fs.promises.access(filePath, fs.constants.F_OK);

    // If file exists, delete it
    await fs.promises.unlink(filePath);

    console.log(`File ${filePath} deleted successfully`);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`File ${filePath} does not exist`);
    } else {
      console.error(`Error deleting file ${filePath}: ${err.message}`);
    }
  }
};

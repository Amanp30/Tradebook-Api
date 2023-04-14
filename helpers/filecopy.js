const fs = require("fs");

exports.fileCopy = function (oldPath, newPath) {
  return new Promise((resolve, reject) => {
    fs.copyFile(oldPath, newPath, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

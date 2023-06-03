const { check } = require("express-validator");
const formidable = require("formidable");

exports.tradeValidator = [
  check("quantity").custom((value, { req }) => {
    const form = formidable({ multiples: true });

    // Parse the FormData object from the request
    form.parse(req, async (err, fields, files) => {
      if (err) {
        throw new Error("Error parsing form data.");
      }

      const quantity = await fields.quantity; // Access the "quantity" value from FormData

      // Perform validation on the "quantity" value
      if (isNaN(quantity)) {
        throw new Error("Quantity must be a number.");
      }
      if (parseFloat(quantity) <= 0) {
        throw new Error("Quantity must be a positive number.");
      }
    });

    // Return true if the validation passes
    return true;
  }),
];

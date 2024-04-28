const crypto = require("crypto");

function nextId() {
      // Generates a 16-byte random ID and converts it to a hex string.
    // This results in a 32-character hexadecimal number.
  return crypto.randomBytes(16).toString("hex");
}

module.exports = nextId;

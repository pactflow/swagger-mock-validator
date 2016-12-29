"use strict";
const validator_1 = require("validator");
exports.isByte = (rawValue) => {
    return validator_1.isBase64(rawValue);
};

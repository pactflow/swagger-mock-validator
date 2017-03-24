"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
exports.isByte = (rawValue) => {
    return validator_1.isBase64(rawValue);
};

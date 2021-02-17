"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isByte = void 0;
const validator_1 = require("validator");
const isByte = (rawValue) => {
    return validator_1.default.isBase64(rawValue);
};
exports.isByte = isByte;

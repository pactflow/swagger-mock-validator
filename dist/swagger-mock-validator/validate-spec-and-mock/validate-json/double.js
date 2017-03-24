"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Decimal = require("decimal.js");
const maximumDoublePrecision = 15;
exports.doubleAjvKeyword = 'formatDouble';
exports.formatForDoubleNumbers = (schema) => {
    if (schema.type === 'number' && schema.format === 'double') {
        delete schema.format;
        schema[exports.doubleAjvKeyword] = true;
    }
};
exports.isDouble = (value) => new Decimal(value).precision() <= maximumDoublePrecision;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const maximumDoublePrecision = 15;
exports.doubleAjvKeyword = 'formatDouble';
exports.formatForDoubleNumbers = (schema) => {
    if (schema.type === 'number' && schema.format === 'double') {
        delete schema.format;
        schema[exports.doubleAjvKeyword] = true;
    }
};
exports.isDouble = (value) => new decimal_js_1.Decimal(value).precision() <= maximumDoublePrecision;

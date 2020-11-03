"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInt64 = exports.formatForInt64Numbers = exports.int64AjvKeyword = void 0;
const decimal_js_1 = require("decimal.js");
const is_type_supported_1 = require("./is-type-supported");
const int64MinValue = decimal_js_1.Decimal.pow(2, 63).negated();
const int64MaxValue = decimal_js_1.Decimal.pow(2, 63).minus(1);
exports.int64AjvKeyword = 'formatInt64';
exports.formatForInt64Numbers = (schema) => {
    if (is_type_supported_1.isTypeSupported('integer', schema.type) && schema.format === 'int64') {
        delete schema.format;
        schema[exports.int64AjvKeyword] = true;
    }
};
exports.isInt64 = (parsedValue) => {
    try {
        const value = new decimal_js_1.Decimal(parsedValue);
        return value.isInteger() && value.greaterThanOrEqualTo(int64MinValue) && value.lessThanOrEqualTo(int64MaxValue);
    }
    catch (error) {
        return false;
    }
};

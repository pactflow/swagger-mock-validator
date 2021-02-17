"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInt32 = exports.formatForInt32Numbers = exports.int32AjvKeyword = void 0;
const decimal_js_1 = require("decimal.js");
const is_type_supported_1 = require("./is-type-supported");
const int32MinValue = decimal_js_1.Decimal.pow(2, 31).negated();
const int32MaxValue = decimal_js_1.Decimal.pow(2, 31).minus(1);
exports.int32AjvKeyword = 'formatInt32';
const formatForInt32Numbers = (schema) => {
    if (is_type_supported_1.isTypeSupported('integer', schema.type) && schema.format === 'int32') {
        delete schema.format;
        schema[exports.int32AjvKeyword] = true;
    }
};
exports.formatForInt32Numbers = formatForInt32Numbers;
const isInt32 = (rawValue) => {
    try {
        const value = new decimal_js_1.Decimal(rawValue);
        return value.isInteger() && value.greaterThanOrEqualTo(int32MinValue) && value.lessThanOrEqualTo(int32MaxValue);
    }
    catch (error) {
        return false;
    }
};
exports.isInt32 = isInt32;

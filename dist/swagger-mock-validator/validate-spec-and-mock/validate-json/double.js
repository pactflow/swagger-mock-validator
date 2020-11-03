"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDouble = exports.formatForDoubleNumbers = exports.doubleAjvKeyword = void 0;
const decimal_js_1 = require("decimal.js");
const is_type_supported_1 = require("./is-type-supported");
exports.doubleAjvKeyword = 'formatDouble';
exports.formatForDoubleNumbers = (schema) => {
    if (is_type_supported_1.isTypeSupported('number', schema.type) && schema.format === 'double') {
        delete schema.format;
        schema[exports.doubleAjvKeyword] = true;
    }
};
exports.isDouble = (rawValue) => {
    try {
        const fullPrecisionValue = new decimal_js_1.Decimal(rawValue);
        const doublePrecisionValue = new decimal_js_1.Decimal(fullPrecisionValue.toNumber());
        return fullPrecisionValue.eq(doublePrecisionValue);
    }
    catch (error) {
        return false;
    }
};

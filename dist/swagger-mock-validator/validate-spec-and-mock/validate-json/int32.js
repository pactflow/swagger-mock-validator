"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const int32MinValue = -Math.pow(2, 31);
const int32MaxValue = Math.pow(2, 31) - 1;
exports.int32AjvKeyword = 'formatInt32';
exports.formatForInt32Numbers = (schema) => {
    if (schema.type === 'integer' && schema.format === 'int32') {
        delete schema.format;
        schema[exports.int32AjvKeyword] = true;
    }
};
exports.isInt32 = (value) => _.isInteger(value) && value >= int32MinValue && value <= int32MaxValue;

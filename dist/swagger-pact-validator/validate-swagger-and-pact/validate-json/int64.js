"use strict";
const _ = require("lodash");
const int64MinValue = -Math.pow(2, 63);
const int64MaxValue = Math.pow(2, 63) - 1;
exports.int64AjvKeyword = 'formatInt64';
exports.formatForInt64Numbers = (schema) => {
    if (schema.type === 'integer' && schema.format === 'int64') {
        delete schema.format;
        schema[exports.int64AjvKeyword] = true;
    }
};
exports.isInt64 = (value) => _.isInteger(value) && value >= int64MinValue && value <= int64MaxValue;

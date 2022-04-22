"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isString = exports.formatForString = exports.stringAjvKeyword = void 0;
const is_type_supported_1 = require("./is-type-supported");
exports.stringAjvKeyword = 'regex';
const SwaggerAjvFormats = ['binary', 'byte', 'password', 'integer', 'date', 'date-time'];
const formatForString = (schema) => {
    if ((0, is_type_supported_1.isTypeSupported)('string', schema.type) &&
        SwaggerAjvFormats.filter((element) => element === schema.format).length ===
            0) {
        delete schema.format;
        schema[exports.stringAjvKeyword] = true;
    }
};
exports.formatForString = formatForString;
const isString = (rawValue) => Object.prototype.toString.call(rawValue) === '[object String]';
exports.isString = isString;

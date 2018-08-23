"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
exports.isOpenApi3Content = (specContent) => {
    const openapiProperty = specContent.openapi;
    return util_1.isString(openapiProperty) && openapiProperty.indexOf('3.') === 0;
};

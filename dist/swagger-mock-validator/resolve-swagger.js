"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SwaggerParser = require("swagger-parser");
exports.default = (document) => {
    return SwaggerParser.validate(document, {
        $refs: {
            circular: 'ignore'
        }
    });
};

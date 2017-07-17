"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const q = require("q");
const SwaggerParser = require("swagger-parser");
exports.default = (document) => {
    return q(SwaggerParser.validate(document, {
        $refs: {
            circular: 'ignore'
        }
    }));
};

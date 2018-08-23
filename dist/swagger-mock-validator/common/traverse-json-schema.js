"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const util_1 = require("util");
exports.traverseJsonSchema = (mutableSchema, visitor) => {
    if (util_1.isBoolean(mutableSchema) || util_1.isUndefined(mutableSchema)) {
        return;
    }
    const traverseSubSchema = (item) => exports.traverseJsonSchema(item, visitor);
    _.each(mutableSchema.definitions, traverseSubSchema);
    _.each(mutableSchema.allOf, traverseSubSchema);
    _.each(mutableSchema.oneOf, traverseSubSchema);
    _.each(mutableSchema.anyOf, traverseSubSchema);
    _.each(mutableSchema.properties, traverseSubSchema);
    traverseSubSchema(mutableSchema.not);
    traverseSubSchema(mutableSchema.items);
    traverseSubSchema(mutableSchema.additionalProperties);
    visitor(mutableSchema);
};

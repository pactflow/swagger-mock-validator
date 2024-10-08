import _ from 'lodash';
import {ParsedSpecJsonSchema, ParsedSpecJsonSchemaCore} from '../spec-parser/parsed-spec';

export type JsonSchemaVisitor = (mutableSchema: ParsedSpecJsonSchemaCore) => void;

export const traverseJsonSchema = (mutableSchema: ParsedSpecJsonSchema | undefined, visitor: JsonSchemaVisitor) => {
    if (typeof mutableSchema === "boolean" || mutableSchema == undefined) {
        return;
    }

    const traverseSubSchema = (item: ParsedSpecJsonSchema | undefined) => traverseJsonSchema(item, visitor);

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

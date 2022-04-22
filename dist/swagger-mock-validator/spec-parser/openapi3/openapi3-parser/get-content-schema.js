"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentSchema = void 0;
const get_schema_with_spec_definitions_1 = require("./get-schema-with-spec-definitions");
const defaultMediaType = 'application/json';
const findApplicationJsonMediaType = (content) => Object.keys(content).find((mediaType) => mediaType.indexOf('application/json') === 0)
    || defaultMediaType;
const getApplicationJsonContentSchema = (content, spec) => {
    const jsonMediaType = findApplicationJsonMediaType(content);
    const jsonContent = content[jsonMediaType];
    const jsonSchema = jsonContent ? jsonContent.schema : undefined;
    return jsonSchema
        ? { schema: (0, get_schema_with_spec_definitions_1.getSchemaWithSpecDefinitions)(jsonSchema, spec), mediaType: jsonMediaType }
        : { mediaType: jsonMediaType };
};
const getContentSchema = (content, spec) => content
    ? getApplicationJsonContentSchema(content, spec)
    : { mediaType: defaultMediaType };
exports.getContentSchema = getContentSchema;

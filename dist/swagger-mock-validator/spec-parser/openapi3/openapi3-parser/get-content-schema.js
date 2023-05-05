"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentSchemasByContentType = exports.getDefaultContentSchema = void 0;
const get_schema_with_spec_definitions_1 = require("./get-schema-with-spec-definitions");
const defaultMediaType = 'application/json';
const findDefaultMediaType = (content) => {
    const mediaTypes = Object.keys(content);
    return mediaTypes.find((mediaType) => mediaType.startsWith('application/json')) || mediaTypes.find((mediaType) => mediaType.match(/application\/.+json/)) || mediaTypes[0] || defaultMediaType;
};
const getApplicationJsonContentSchema = (content, spec) => {
    const mediaType = findDefaultMediaType(content);
    const schema = content[mediaType] ? content[mediaType].schema : undefined;
    return schema
        ? { schema: (0, get_schema_with_spec_definitions_1.getSchemaWithSpecDefinitions)(schema, spec), mediaType }
        : { mediaType };
};
const getDefaultContentSchema = (content, spec) => content
    ? getApplicationJsonContentSchema(content, spec)
    : { mediaType: defaultMediaType };
exports.getDefaultContentSchema = getDefaultContentSchema;
// tslint:disable:cyclomatic-complexity
const getContentSchemasByContentType = (content, spec) => {
    const result = {};
    if (!content) {
        return result;
    }
    const mediaTypes = Object.keys(content);
    for (const mediaType of mediaTypes) {
        if (content[mediaType] && content[mediaType].schema) {
            result[mediaType] = (0, get_schema_with_spec_definitions_1.getSchemaWithSpecDefinitions)(content[mediaType].schema, spec);
        }
    }
    return result;
};
exports.getContentSchemasByContentType = getContentSchemasByContentType;
// tslint:enable:cyclomatic-complexity

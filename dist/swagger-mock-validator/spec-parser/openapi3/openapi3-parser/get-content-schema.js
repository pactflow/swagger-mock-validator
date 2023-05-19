"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaByContentType = void 0;
const get_schema_with_spec_definitions_1 = require("./get-schema-with-spec-definitions");
const content_negotiation_1 = require("../../../validate-spec-and-mock/content-negotiation");
const defaultMediaType = 'application/json';
const findDefaultMediaType = (content) => {
    const mediaTypes = Object.keys(content);
    return mediaTypes.find((mediaType) => mediaType.startsWith('application/json')) || mediaTypes.find((mediaType) => mediaType.match(/application\/.+json/)) || mediaTypes[0] || defaultMediaType;
};
// tslint:disable:cyclomatic-complexity
const schemaByContentType = (content, spec) => (mediaType) => {
    var _a;
    if (!content) {
        return undefined;
    }
    const effectiveMediaType = mediaType || findDefaultMediaType(content);
    const normalizedMediaType = (0, content_negotiation_1.normalizeMediaType)(effectiveMediaType);
    const mediaTypes = Object.keys(content);
    const contentMediaType = mediaTypes.find(type => (0, content_negotiation_1.areMediaTypesCompatible)((0, content_negotiation_1.normalizeMediaType)(type), normalizedMediaType));
    if (!contentMediaType) {
        return undefined;
    }
    const schema = (_a = content[contentMediaType]) === null || _a === void 0 ? void 0 : _a.schema;
    if (!schema) {
        return undefined;
    }
    return {
        schema: (0, get_schema_with_spec_definitions_1.getSchemaWithSpecDefinitions)(schema, spec),
        mediaType: contentMediaType
    };
};
exports.schemaByContentType = schemaByContentType;
// tslint:enable:cyclomatic-complexity

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParsedRequestBodyValues = void 0;
const _ = require("lodash");
const dereference_component_1 = require("./dereference-component");
const get_content_mime_types_1 = require("./get-content-mime-types");
const get_content_schema_1 = require("./get-content-schema");
const parseRequestBody = (parentOperation, requestBody, spec) => {
    const { schema, mediaType } = (0, get_content_schema_1.getContentSchema)(requestBody.content, spec);
    return schema
        ? {
            getFromSchema: (pathToGet) => {
                return {
                    location: `${parentOperation.location}.requestBody.content.${mediaType}.schema.${pathToGet}`,
                    parentOperation,
                    value: _.get(schema, pathToGet)
                };
            },
            name: '',
            required: requestBody.required || false,
            schema
        }
        : undefined;
};
const createConsumesWithMimeTypes = (parentOperation, mimeTypes) => ({
    location: `${parentOperation.location}.requestBody.content`,
    parentOperation,
    value: mimeTypes
});
const defaultConsumesAndRequestBodyParameter = (parentOperation) => ({
    consumes: createConsumesWithMimeTypes(parentOperation, [])
});
const getConsumesAndRequestBodyParameter = (requestBody, parentOperation, spec) => {
    const dereferencedRequestBody = (0, dereference_component_1.dereferenceComponent)(requestBody, spec);
    const requestBodyParameter = parseRequestBody(parentOperation, dereferencedRequestBody, spec);
    return {
        consumes: createConsumesWithMimeTypes(parentOperation, (0, get_content_mime_types_1.getContentMimeTypes)(dereferencedRequestBody.content)),
        requestBodyParameter
    };
};
const getParsedRequestBodyValues = (parentOperation, spec) => {
    return parentOperation.value.requestBody
        ? getConsumesAndRequestBodyParameter(parentOperation.value.requestBody, parentOperation, spec)
        : defaultConsumesAndRequestBodyParameter(parentOperation);
};
exports.getParsedRequestBodyValues = getParsedRequestBodyValues;

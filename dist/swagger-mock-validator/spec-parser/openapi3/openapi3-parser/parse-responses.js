"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponses = void 0;
const _ = require("lodash");
const dereference_component_1 = require("./dereference-component");
const get_content_mime_types_1 = require("./get-content-mime-types");
const get_content_schema_1 = require("./get-content-schema");
const parse_response_headers_1 = require("./parse-response-headers");
const parseResponse = ({ response, parentOperation, responseLocation, spec }) => {
    const dereferencedResponse = dereference_component_1.dereferenceComponent(response, spec);
    const { schema, mediaType } = get_content_schema_1.getContentSchema(dereferencedResponse.content, spec);
    return {
        getFromSchema: (pathToGet) => {
            return {
                location: `${responseLocation}.content.${mediaType}.schema.${pathToGet}`,
                parentOperation,
                value: _.get(schema, pathToGet)
            };
        },
        headers: parse_response_headers_1.parseResponseHeaders(dereferencedResponse.headers, parentOperation, `${responseLocation}.headers`, spec),
        location: `${responseLocation}`,
        parentOperation,
        produces: {
            location: `${responseLocation}.content`,
            parentOperation,
            value: get_content_mime_types_1.getContentMimeTypes(dereferencedResponse.content)
        },
        schema,
        value: response
    };
};
exports.parseResponses = (operation, parentOperation, spec) => {
    const responsesLocation = `${parentOperation.location}.responses`;
    const parsedResponses = Object.keys(operation.responses)
        .reduce((allParsedResponses, responseStatus) => {
        const response = operation.responses[responseStatus];
        allParsedResponses[responseStatus] = parseResponse({
            parentOperation,
            response,
            responseLocation: `${responsesLocation}.${responseStatus}`,
            spec
        });
        return allParsedResponses;
    }, {});
    return Object.assign({ location: responsesLocation, parentOperation, value: operation.responses }, parsedResponses);
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponseHeaders = void 0;
const dereference_component_1 = require("./dereference-component");
const to_parsed_spec_parameter_1 = require("./to-parsed-spec-parameter");
const parseHeader = (header, name, parentOperation, headersRootLocation, spec) => {
    const dereferencedHeader = (0, dereference_component_1.dereferenceComponent)(header, spec);
    const location = `${headersRootLocation}.${name}`;
    return (0, to_parsed_spec_parameter_1.toParsedSpecParameter)({ parameter: dereferencedHeader, name, parentOperation, location });
};
const doParseResponseHeaders = (headers, parentOperation, headersRootLocation, spec) => Object.keys(headers)
    .reduce((parsedHeaders, headerName) => {
    parsedHeaders[headerName] = parseHeader(headers[headerName], headerName, parentOperation, headersRootLocation, spec);
    return parsedHeaders;
}, {});
const parseResponseHeaders = (headers, parentOperation, headersRootLocation, spec) => headers
    ? doParseResponseHeaders(headers, parentOperation, headersRootLocation, spec)
    : {};
exports.parseResponseHeaders = parseResponseHeaders;

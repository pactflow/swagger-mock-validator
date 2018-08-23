"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dereference_component_1 = require("./dereference-component");
const to_parsed_spec_parameter_1 = require("./to-parsed-spec-parameter");
const parseHeader = (header, name, parentOperation, headersRootLocation, spec) => {
    const dereferencedHeader = dereference_component_1.dereferenceComponent(header, spec);
    const location = `${headersRootLocation}.${name}`;
    return to_parsed_spec_parameter_1.toParsedSpecParameter({ parameter: dereferencedHeader, name, parentOperation, location, spec });
};
const doParseResponseHeaders = (headers, parentOperation, headersRootLocation, spec) => Object.keys(headers)
    .reduce((parsedHeaders, headerName) => {
    parsedHeaders[headerName] = parseHeader(headers[headerName], headerName, parentOperation, headersRootLocation, spec);
    return parsedHeaders;
}, {});
exports.parseResponseHeaders = (headers, parentOperation, headersRootLocation, spec) => headers
    ? doParseResponseHeaders(headers, parentOperation, headersRootLocation, spec)
    : {};

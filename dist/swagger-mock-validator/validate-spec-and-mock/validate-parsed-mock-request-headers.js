"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const headerUsedForSecurity = (headerName, parsedSpecOperation) => _.some(parsedSpecOperation.securityRequirements, (securityRequirement) => _.some(securityRequirement, (requirement) => requirement.credentialLocation === 'header' && requirement.credentialKey === headerName));
const standardHttpRequestHeaders = [
    'accept',
    'accept-charset',
    'accept-datetime',
    'accept-encoding',
    'accept-language',
    'authorization',
    'cache-control',
    'connection',
    'content-length',
    'content-md5',
    'content-type',
    'cookie',
    'date',
    'expect',
    'forwarded',
    'from',
    'host',
    'if-match',
    'if-modified-since',
    'if-none-match',
    'if-range',
    'if-unmodified-since',
    'max-forwards',
    'origin',
    'pragma',
    'proxy-authorization',
    'range',
    'referer',
    'te',
    'upgrade',
    'user-agent',
    'via',
    'warning'
];
const getWarningForUndefinedHeader = (headerName, parsedMockRequestHeader, parsedSpecOperation) => {
    if (standardHttpRequestHeaders.indexOf(headerName) > -1 || headerUsedForSecurity(headerName, parsedSpecOperation)) {
        return [];
    }
    return [result_1.default.build({
            code: 'spv.request.header.unknown',
            message: `Request header is not defined in the swagger file: ${headerName}`,
            mockSegment: parsedMockRequestHeader,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
};
exports.default = (parsedMockInteraction, parsedSpecOperation) => _(_.keys(parsedMockInteraction.requestHeaders))
    .union(_.keys(parsedSpecOperation.requestHeaderParameters))
    .map((headerName) => {
    const parsedMockRequestHeader = parsedMockInteraction.requestHeaders[headerName];
    const parsedSpecRequestHeader = parsedSpecOperation.requestHeaderParameters[headerName];
    if (!parsedSpecRequestHeader && parsedMockRequestHeader) {
        return getWarningForUndefinedHeader(headerName, parsedMockRequestHeader, parsedSpecOperation);
    }
    const validationResult = validate_mock_value_against_spec_1.default(parsedSpecRequestHeader, parsedMockRequestHeader, parsedMockInteraction, 'spv.request.header.incompatible');
    return validationResult.results;
})
    .flatten()
    .value();

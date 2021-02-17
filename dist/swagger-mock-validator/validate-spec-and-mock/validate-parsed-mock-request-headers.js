"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedMockRequestHeaders = void 0;
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
    return [result_1.result.build({
            code: 'request.header.unknown',
            message: `Request header is not defined in the spec file: ${headerName}`,
            mockSegment: parsedMockRequestHeader,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
};
const validateParsedMockRequestHeader = (parsedMockInteraction, parsedSpecOperation, headerName, mockHeader, specHeader) => {
    if (!specHeader && mockHeader) {
        return getWarningForUndefinedHeader(headerName, mockHeader, parsedSpecOperation);
    }
    const validationResult = validate_mock_value_against_spec_1.validateMockValueAgainstSpec(specHeader, mockHeader, parsedMockInteraction, 'request.header.incompatible');
    return validationResult.results;
};
const validateParsedMockRequestHeaders = (parsedMockInteraction, parsedSpecOperation) => {
    const mockRequestHeaders = parsedMockInteraction.requestHeaders;
    const specRequestHeaders = parsedSpecOperation.requestHeaderParameters;
    return _(_.keys(mockRequestHeaders))
        .union(_.keys(specRequestHeaders))
        .map((headerName) => validateParsedMockRequestHeader(parsedMockInteraction, parsedSpecOperation, headerName, mockRequestHeaders[headerName], specRequestHeaders[headerName]))
        .flatten()
        .value();
};
exports.validateParsedMockRequestHeaders = validateParsedMockRequestHeaders;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedMockResponseHeaders = void 0;
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const ignoredHttpHeaders = [
    'content-type'
];
const standardHttpHeaders = [
    'access-control-allow-origin',
    'accept-patch',
    'accept-ranges',
    'age',
    'allow',
    'alt-svc',
    'cache-control',
    'connection',
    'content-disposition',
    'content-encoding',
    'content-language',
    'content-length',
    'content-location',
    'content-md5',
    'content-range',
    'date',
    'etag',
    'expires',
    'last-modified',
    'link',
    'location',
    'p3p',
    'pragma',
    'proxy-authenticate',
    'public-key-pins',
    'refresh',
    'retry-after',
    'server',
    'set-cookie',
    'status',
    'strict-transport-security',
    'trailer',
    'transfer-encoding',
    'tsv',
    'upgrade',
    'vary',
    'via',
    'warning',
    'www-authenticate',
    'x-frame-options'
];
const createUndefinedHeaderValidationResult = (headerName, mockHeader, parsedSpecResponse) => result_1.result.build({
    code: 'response.header.unknown',
    message: `Response header is not defined in the spec file: ${headerName}`,
    mockSegment: mockHeader,
    source: 'spec-mock-validation',
    specSegment: parsedSpecResponse
});
const createUndefinedStandardHeaderValidationResult = (headerName, mockHeader, parsedSpecResponse) => result_1.result.build({
    code: 'response.header.undefined',
    message: `Standard http response header is not defined in the spec file: ${headerName}`,
    mockSegment: mockHeader,
    source: 'spec-mock-validation',
    specSegment: parsedSpecResponse
});
const shouldIgnoreHeader = (headerName) => ignoredHttpHeaders.indexOf(headerName) > -1;
const isStandardHeader = (headerName) => standardHttpHeaders.indexOf(headerName) > -1;
const validateMockHeaderMissingInSpec = (headerName, mockHeader, parsedSpecResponse) => {
    if (shouldIgnoreHeader(headerName)) {
        return [];
    }
    if (isStandardHeader(headerName)) {
        return [createUndefinedStandardHeaderValidationResult(headerName, mockHeader, parsedSpecResponse)];
    }
    return [createUndefinedHeaderValidationResult(headerName, mockHeader, parsedSpecResponse)];
};
const validateParsedMockResponseHeader = (headerName, parsedMockResponseHeader, parsedSpecResponseHeader, parsedMockInteraction, parsedSpecResponse) => {
    if (!parsedSpecResponseHeader) {
        return validateMockHeaderMissingInSpec(headerName, parsedMockResponseHeader, parsedSpecResponse);
    }
    const validationResult = validate_mock_value_against_spec_1.validateMockValueAgainstSpec(parsedSpecResponseHeader, parsedMockResponseHeader, parsedMockInteraction, 'response.header.incompatible');
    return validationResult.results;
};
const validateParsedMockResponseHeaders = (parsedMockInteraction, parsedSpecResponse) => {
    const mockResponseHeaders = parsedMockInteraction.responseHeaders;
    const specResponseHeaders = parsedSpecResponse.headers;
    return _(mockResponseHeaders)
        .map((parsedMockResponseHeader, headerName) => validateParsedMockResponseHeader(headerName, parsedMockResponseHeader, specResponseHeaders[headerName], parsedMockInteraction, parsedSpecResponse))
        .flatten()
        .value();
};
exports.validateParsedMockResponseHeaders = validateParsedMockResponseHeaders;

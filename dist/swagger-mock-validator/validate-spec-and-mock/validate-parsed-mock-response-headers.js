"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = (parsedMockInteraction, parsedSpecResponse) => _(parsedMockInteraction.responseHeaders)
    .map((parsedMockResponseHeader, headerName) => {
    const parsedSpecResponseHeader = parsedSpecResponse.headers[headerName];
    if (!parsedSpecResponseHeader) {
        if (ignoredHttpHeaders.indexOf(headerName) > -1) {
            return [];
        }
        if (standardHttpHeaders.indexOf(headerName) > -1) {
            return [result_1.default.build({
                    code: 'spv.response.header.undefined',
                    message: `Standard http response header is not defined in the swagger file: ${headerName}`,
                    mockSegment: parsedMockResponseHeader,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecResponse
                })];
        }
        return [result_1.default.build({
                code: 'spv.response.header.unknown',
                message: `Response header is not defined in the swagger file: ${headerName}`,
                mockSegment: parsedMockResponseHeader,
                source: 'spec-mock-validation',
                specSegment: parsedSpecResponse
            })];
    }
    const validationResult = validate_mock_value_against_spec_1.default(parsedSpecResponseHeader, parsedMockResponseHeader, parsedMockInteraction, 'spv.response.header.incompatible');
    return validationResult.results;
})
    .flatten()
    .value();

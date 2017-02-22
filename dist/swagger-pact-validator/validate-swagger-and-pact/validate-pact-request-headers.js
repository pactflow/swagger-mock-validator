"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const headerUsedForSecurity = (headerName, swaggerOperation) => _.some(swaggerOperation.securityRequirements, (securityRequirement) => _.some(securityRequirement, (requirement) => requirement.credentialLocation === 'header' && requirement.credentialKey === headerName));
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
const getWarningForUndefinedHeader = (headerName, pactHeader, swaggerOperation) => {
    if (standardHttpRequestHeaders.indexOf(headerName) > -1 || headerUsedForSecurity(headerName, swaggerOperation)) {
        return [];
    }
    return [result_1.default.build({
            code: 'spv.request.header.unknown',
            message: `Request header is not defined in the swagger file: ${headerName}`,
            pactSegment: pactHeader,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })];
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => _(_.keys(pactInteraction.requestHeaders))
    .union(_.keys(swaggerOperation.requestHeaderParameters))
    .map((headerName) => {
    const pactHeader = pactInteraction.requestHeaders[headerName];
    const swaggerHeader = swaggerOperation.requestHeaderParameters[headerName];
    if (!swaggerHeader && pactHeader) {
        return getWarningForUndefinedHeader(headerName, pactHeader, swaggerOperation);
    }
    const validationResult = validate_mock_value_against_spec_1.default(swaggerHeader, pactHeader, pactInteraction, 'spv.request.header.incompatible');
    return validationResult.results;
})
    .flatten()
    .value();

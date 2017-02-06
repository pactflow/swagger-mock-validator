import * as _ from 'lodash';
import result from '../result';
import {ParsedMockInteraction, ParsedMockValue, ParsedSpecOperation} from '../types';
import validateMockValueAgainstSpec from './validate-mock-value-against-spec';

const headerUsedForSecurity = (headerName: string, swaggerOperation: ParsedSpecOperation) =>
    _.some(swaggerOperation.securityRequirements, (securityRequirement) =>
        _.some(securityRequirement, (requirement) =>
            requirement.credentialLocation === 'header' && requirement.credentialKey === headerName
        )
    );

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

const getWarningForUndefinedHeader = (
    headerName: string,
    pactHeader: ParsedMockValue<string>,
    swaggerOperation: ParsedSpecOperation
) => {
    if (standardHttpRequestHeaders.indexOf(headerName) > -1 || headerUsedForSecurity(headerName, swaggerOperation)) {
        return [];
    }

    return [result.warning({
        message: `Request header is not defined in the swagger file: ${headerName}`,
        pactSegment: pactHeader,
        source: 'swagger-pact-validation',
        swaggerSegment: swaggerOperation
    })];
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) =>
    _(_.keys(pactInteraction.requestHeaders))
        .union(_.keys(swaggerOperation.requestHeaderParameters))
        .map((headerName) => {
            const pactHeader = pactInteraction.requestHeaders[headerName];
            const swaggerHeader = swaggerOperation.requestHeaderParameters[headerName];

            if (!swaggerHeader && pactHeader) {
                return getWarningForUndefinedHeader(headerName, pactHeader, swaggerOperation);
            }

            return validateMockValueAgainstSpec(swaggerHeader, pactHeader, pactInteraction).results;
        })
        .flatten()
        .value();

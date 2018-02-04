import * as _ from 'lodash';
import {result} from '../result';
import {ParsedMockInteraction, ParsedMockValue, ParsedSpecOperation} from '../types';
import {validateMockValueAgainstSpec} from './validate-mock-value-against-spec';

const headerUsedForSecurity = (headerName: string, parsedSpecOperation: ParsedSpecOperation) =>
    _.some(parsedSpecOperation.securityRequirements, (securityRequirement) =>
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

const getWarningForUndefinedHeader = (headerName: string,
                                      parsedMockRequestHeader: ParsedMockValue<string>,
                                      parsedSpecOperation: ParsedSpecOperation) => {
    if (standardHttpRequestHeaders.indexOf(headerName) > -1 || headerUsedForSecurity(headerName, parsedSpecOperation)) {
        return [];
    }

    return [result.build({
        code: 'spv.request.header.unknown',
        message: `Request header is not defined in the swagger file: ${headerName}`,
        mockSegment: parsedMockRequestHeader,
        source: 'spec-mock-validation',
        specSegment: parsedSpecOperation
    })];
};

export const validateParsedMockRequestHeaders = (parsedMockInteraction: ParsedMockInteraction,
                                                 parsedSpecOperation: ParsedSpecOperation) =>
    _(_.keys(parsedMockInteraction.requestHeaders))
        .union(_.keys(parsedSpecOperation.requestHeaderParameters))
        .map((headerName) => {
            const parsedMockRequestHeader = parsedMockInteraction.requestHeaders[headerName];
            const parsedSpecRequestHeader = parsedSpecOperation.requestHeaderParameters[headerName];

            if (!parsedSpecRequestHeader && parsedMockRequestHeader) {
                return getWarningForUndefinedHeader(headerName, parsedMockRequestHeader, parsedSpecOperation);
            }

            const validationResult = validateMockValueAgainstSpec(
                parsedSpecRequestHeader,
                parsedMockRequestHeader,
                parsedMockInteraction,
                'spv.request.header.incompatible'
            );

            return validationResult.results;
        })
        .flatten()
        .value();

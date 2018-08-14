import * as _ from 'lodash';
import {ValidationResult} from '../../api-types';
import {ParsedMockInteraction, ParsedMockValue} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecOperation, ParsedSpecParameter} from '../spec-parser/parsed-spec';
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
        code: 'request.header.unknown',
        message: `Request header is not defined in the spec file: ${headerName}`,
        mockSegment: parsedMockRequestHeader,
        source: 'spec-mock-validation',
        specSegment: parsedSpecOperation
    })];
};

const validateParsedMockRequestHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    headerName: string,
    mockHeader: ParsedMockValue<string>,
    specHeader: ParsedSpecParameter
): ValidationResult[] => {
    if (!specHeader && mockHeader) {
        return getWarningForUndefinedHeader(headerName, mockHeader, parsedSpecOperation);
    }

    const validationResult = validateMockValueAgainstSpec(
        specHeader,
        mockHeader,
        parsedMockInteraction,
        'request.header.incompatible'
    );

    return validationResult.results;
};

export const validateParsedMockRequestHeaders = (parsedMockInteraction: ParsedMockInteraction,
                                                 parsedSpecOperation: ParsedSpecOperation) => {
    const mockRequestHeaders = parsedMockInteraction.requestHeaders;
    const specRequestHeaders = parsedSpecOperation.requestHeaderParameters;

    return _(_.keys(mockRequestHeaders))
        .union(_.keys(specRequestHeaders))
        .map((headerName) =>
            validateParsedMockRequestHeader(
                parsedMockInteraction,
                parsedSpecOperation,
                headerName,
                mockRequestHeaders[headerName],
                specRequestHeaders[headerName]))
        .flatten()
        .value();
};

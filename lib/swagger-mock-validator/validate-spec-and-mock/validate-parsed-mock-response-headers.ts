import _ from 'lodash';
import {ValidationResult} from '../../api-types';
import {ParsedMockInteraction, ParsedMockValue} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecParameter, ParsedSpecResponse} from '../spec-parser/parsed-spec';
import {validateMockValueAgainstSpec} from './validate-mock-value-against-spec';

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

const createUndefinedHeaderValidationResult = (
    headerName: string,
    mockHeader: ParsedMockValue<string>,
    parsedSpecResponse: ParsedSpecResponse
): ValidationResult =>
    result.build({
        code: 'response.header.unknown',
        message: `Response header is not defined in the spec file: ${headerName}`,
        mockSegment: mockHeader,
        source: 'spec-mock-validation',
        specSegment: parsedSpecResponse
    });

const createUndefinedStandardHeaderValidationResult = (
    headerName: string,
    mockHeader: ParsedMockValue<string>,
    parsedSpecResponse: ParsedSpecResponse
): ValidationResult =>
    result.build({
        code: 'response.header.undefined',
        message: `Standard http response header is not defined in the spec file: ${headerName}`,
        mockSegment: mockHeader,
        source: 'spec-mock-validation',
        specSegment: parsedSpecResponse
    });

const shouldIgnoreHeader = (headerName: string): boolean =>
    ignoredHttpHeaders.indexOf(headerName) > -1;

const isStandardHeader = (headerName: string): boolean =>
    standardHttpHeaders.indexOf(headerName) > -1;

const validateMockHeaderMissingInSpec = (
    headerName: string,
    mockHeader: ParsedMockValue<string>,
    parsedSpecResponse: ParsedSpecResponse
): ValidationResult[] => {
    if (shouldIgnoreHeader(headerName)) {
        return [];
    }

    if (isStandardHeader(headerName)) {
        return [createUndefinedStandardHeaderValidationResult(headerName, mockHeader, parsedSpecResponse)];
    }

    return [createUndefinedHeaderValidationResult(headerName, mockHeader, parsedSpecResponse)];
};

const validateParsedMockResponseHeader = (
    headerName: string,
    parsedMockResponseHeader: ParsedMockValue<string>,
    parsedSpecResponseHeader: ParsedSpecParameter | undefined,
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecResponse: ParsedSpecResponse
): ValidationResult[] => {
    if (!parsedSpecResponseHeader) {
        return validateMockHeaderMissingInSpec(headerName, parsedMockResponseHeader, parsedSpecResponse);
    }

    const validationResult = validateMockValueAgainstSpec(
        parsedSpecResponseHeader,
        parsedMockResponseHeader,
        parsedMockInteraction,
        'response.header.incompatible'
    );

    return validationResult.results;
};

export const validateParsedMockResponseHeaders = (parsedMockInteraction: ParsedMockInteraction,
                                                  parsedSpecResponse: ParsedSpecResponse) => {
    const mockResponseHeaders = parsedMockInteraction.responseHeaders;
    const specResponseHeaders = parsedSpecResponse.headers;

    return _(mockResponseHeaders)
        .map((parsedMockResponseHeader: ParsedMockValue<string>, headerName: string) =>
            validateParsedMockResponseHeader(
                headerName,
                parsedMockResponseHeader,
                specResponseHeaders[headerName],
                parsedMockInteraction,
                parsedSpecResponse))
        .flatten()
        .value();
};

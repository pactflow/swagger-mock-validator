import * as _ from 'lodash';
import result from '../result';
import {ParsedMockInteraction, ParsedMockValue, ParsedSpecResponse} from '../types';
import validateMockValueAgainstSpec from './validate-mock-value-against-spec';

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

export default (pactInteraction: ParsedMockInteraction, swaggerResponse: ParsedSpecResponse) =>
    _(pactInteraction.responseHeaders)
        .map((headerValue: ParsedMockValue<string>, headerName: string) => {
            const swaggerHeader = swaggerResponse.headers[headerName];

            if (!swaggerHeader) {
                if (ignoredHttpHeaders.indexOf(headerName) > -1) {
                    return [];
                }

                if (standardHttpHeaders.indexOf(headerName) > -1) {
                    return [result.warning({
                        message: `Standard http response header is not defined in the swagger file: ${headerName}`,
                        pactSegment: headerValue,
                        source: 'swagger-pact-validation',
                        swaggerSegment: swaggerResponse
                    })];
                }

                return [result.error({
                    message: `Response header is not defined in the swagger file: ${headerName}`,
                    pactSegment: headerValue,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerResponse
                })];
            }

            return validateMockValueAgainstSpec(headerName, swaggerHeader, headerValue, pactInteraction).results;
        })
        .flatten()
        .value();

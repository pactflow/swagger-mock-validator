import * as _ from 'lodash';
import result from '../result';
import {ParsedMockInteraction, ParsedMockValue, ParsedSpecOperation} from '../types';
import validateMockValueAgainstSpec from './validate-mock-value-against-spec';

const standardHttpRequestHeaders = [
    'Accept',
    'Accept-Charset',
    'Accept-Datetime',
    'Accept-Encoding',
    'Accept-Language',
    'Authorization',
    'Cache-Control',
    'Connection',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Cookie',
    'Date',
    'Expect',
    'Forwarded',
    'From',
    'Host',
    'If-Match',
    'If-Modified-Since',
    'If-None-Match',
    'If-Range',
    'If-Unmodified-Since',
    'Max-Forwards',
    'Origin',
    'Pragma',
    'Proxy-Authorization',
    'Range',
    'Referer',
    'TE',
    'Upgrade',
    'User-Agent',
    'Via',
    'Warning'
];

const getWarningForUndefinedHeaderOrNone = (
    headerName: string,
    pactHeader: ParsedMockValue<string>,
    swaggerOperation: ParsedSpecOperation
) => {
    if (standardHttpRequestHeaders.indexOf(headerName) > -1) {
        return [];
    }

    return [result.warning({
        message: `Request header is not defined in the swagger file: ${headerName}`,
        pactSegment: pactHeader,
        source: 'swagger-pact-validation',
        swaggerSegment: swaggerOperation
    })];
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const allHeaders = _.union(_.keys(pactInteraction.requestHeaders), _.keys(swaggerOperation.headerParameters));

    const validationErrors = _.map(allHeaders, (headerName) => {
        const pactHeader = pactInteraction.requestHeaders[headerName];
        const swaggerHeader = swaggerOperation.headerParameters[headerName];

        if (!swaggerHeader && pactHeader) {
            return getWarningForUndefinedHeaderOrNone(headerName, pactHeader, swaggerOperation);
        }

        return validateMockValueAgainstSpec(headerName, swaggerHeader, pactHeader, pactInteraction).results;
    });

    return _.flatten(validationErrors);
};

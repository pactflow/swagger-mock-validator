import * as Ajv from 'ajv';
import * as _ from 'lodash';
import result from '../result';
import {JsonSchema, ParsedMockInteraction, ParsedMockValue, ParsedSpecOperation, ParsedSpecParameter} from '../types';

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

const toJsonSchema = (parameter: ParsedSpecParameter): JsonSchema => {
    const schema: JsonSchema = {
        properties: {
            value: {
                type: parameter.type as any
            }
        },
        type: 'object'
    };

    if (parameter.required) {
        schema.required = ['value'];
    }

    return schema;
};

const validateJson = (jsonSchema: JsonSchema, json: any) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: true,
        verbose: true
    });

    ajv.validate(jsonSchema, json);

    return ajv.errors;
};

const validateMockHeaderAgainstSpec = <T>(
    headerName: string,
    swaggerHeader: ParsedSpecParameter,
    pactHeader: ParsedMockValue<T>,
    pactInteraction: ParsedMockInteraction
) => {
    if (swaggerHeader.type === 'array') {
        return [result.warning({
            message: `Validating headers of type "${swaggerHeader.type}" are not supported, ` +
            `assuming value is valid: ${headerName}`,
            pactSegment: pactHeader,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerHeader
        })];
    }

    const swaggerHeaderSchema = toJsonSchema(swaggerHeader);
    const errors = validateJson(swaggerHeaderSchema, {value: (pactHeader || {value: undefined}).value});

    return _.map(errors, (error) => result.error({
        message: 'Request header is incompatible with the header parameter defined in the swagger file: ' +
        error.message,
        pactSegment: pactHeader || pactInteraction,
        source: 'swagger-pact-validation',
        swaggerSegment: swaggerHeader
    }));
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const allHeaders = _.union(_.keys(pactInteraction.requestHeaders), _.keys(swaggerOperation.headerParameters));

    const validationErrors = _.map(allHeaders, (headerName) => {
        const pactHeader = pactInteraction.requestHeaders[headerName];
        const swaggerHeader = swaggerOperation.headerParameters[headerName];

        if (!swaggerHeader && pactHeader) {
            return getWarningForUndefinedHeaderOrNone(headerName, pactHeader, swaggerOperation);
        }

        return validateMockHeaderAgainstSpec(headerName, swaggerHeader, pactHeader, pactInteraction);
    });

    return _.flatten(validationErrors);
};

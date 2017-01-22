import * as _ from 'lodash';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';
import Negotiator = require('negotiator');
import result from '../result';

const contentTypeHeaderName = 'content-type';

const validateSwaggerHasNoConsumesValue = (
    pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation, pactContentTypeHeaderValue: string
) => {
    return pactContentTypeHeaderValue
        ? [result.warning({
            message: 'Request content-type header is defined but there is no consumes definition in the spec',
            pactSegment: pactInteraction.requestHeaders[contentTypeHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })]
        : [];
};

const validatePactHasNoContentTypeHeader = (
    pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation
) => {
    return pactInteraction.requestBody.value
        ? [result.warning({
            message: 'Request content type header is not defined but there is consumes definition in the spec',
            pactSegment: pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.consumes
        })]
        : [];
};

const newNegotiator = (acceptHeaderValue: string) => {
    return new Negotiator({
        headers: {
            accept: acceptHeaderValue
        }
    });
};

const validatePactContentTypeAgainstSwaggerConsumes = (
    pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation, pactContentTypeHeaderValue: string
) => {
    const foundMatches = newNegotiator(pactContentTypeHeaderValue).mediaTypes(swaggerOperation.consumes.value);

    if (foundMatches.length === 0) {
        return [result.error({
            message: 'Content-Type header is incompatible with the consumes mime type defined in the swagger file',
            pactSegment: pactInteraction.requestHeaders[contentTypeHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.consumes
        })];
    }

    return [];
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const pactContentTypeHeaderValue = _.get<string>(pactInteraction.requestHeaders[contentTypeHeaderName], 'value');
    const swaggerHasConsumesValue = swaggerOperation.consumes.value.length > 0;

    if (!swaggerHasConsumesValue) {
        return validateSwaggerHasNoConsumesValue(pactInteraction, swaggerOperation, pactContentTypeHeaderValue);
    }

    if (!pactContentTypeHeaderValue) {
        return validatePactHasNoContentTypeHeader(pactInteraction, swaggerOperation);
    }

    return validatePactContentTypeAgainstSwaggerConsumes(pactInteraction, swaggerOperation, pactContentTypeHeaderValue);
};

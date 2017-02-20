import * as _ from 'lodash';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';
import Negotiator = require('negotiator');
import result from '../result';

const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';

const negotiateMediaType = (acceptableMediaTypes: string, availableMediaTypes: string[]) =>
    new Negotiator({headers: {accept: acceptableMediaTypes}}).mediaTypes(availableMediaTypes);

const validatePactRequestAcceptsHeader = (
    pactInteraction: ParsedMockInteraction,
    swaggerOperation: ParsedSpecOperation
) => {
    const acceptHeaderValue = _.get<string>(pactInteraction.requestHeaders[acceptHeaderName], 'value');

    if (!acceptHeaderValue) {
        return [];
    }

    if (swaggerOperation.produces.value.length === 0) {
        return [result.build({
            code: 'spv.request.accept.unknown',
            message: 'Request Accept header is defined but there is no produces definition in the spec',
            pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })];
    }

    const matchingMediaTypes = negotiateMediaType(acceptHeaderValue, swaggerOperation.produces.value);

    if (matchingMediaTypes.length === 0) {
        return [result.build({
            code: 'spv.request.accept.incompatible',
            message: 'Request Accept header is incompatible with the produces mime type defined in the swagger file',
            pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.produces
        })];
    }

    return [];
};

const validatePactResponseContentTypeAndBody = (
    pactInteraction: ParsedMockInteraction,
    swaggerOperation: ParsedSpecOperation
) => {
    const contentType = _.get<string>(pactInteraction.responseHeaders[contentTypeHeaderName], `value`);

    if (!contentType) {
        return [];
    }

    if (swaggerOperation.produces.value.length === 0) {
        return [result.build({
            code: 'spv.response.content-type.unknown',
            message: 'Response Content-Type header is defined but there is no produces definition in the spec',
            pactSegment: pactInteraction.responseHeaders[contentTypeHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })];
    }

    const matchingMediaTypes = negotiateMediaType(contentType, swaggerOperation.produces.value);

    if (matchingMediaTypes.length === 0) {
        return [result.build({
            code: 'spv.response.content-type.incompatible',
            message: 'Response Content-Type header is incompatible with the produces mime ' +
            'type defined in the swagger file',
            pactSegment: pactInteraction.responseHeaders[contentTypeHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.produces
        })];
    }

    return [];
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    return _.concat(
        validatePactRequestAcceptsHeader(pactInteraction, swaggerOperation),
        validatePactResponseContentTypeAndBody(pactInteraction, swaggerOperation)
    );
};

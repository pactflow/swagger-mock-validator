import * as _ from 'lodash';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';
import Negotiator = require('negotiator');
import result from '../result';

const acceptHeaderName = 'accept';

const newNegotiator = (acceptHeaderValue: string) => {
    return new Negotiator({
        headers: {
            accept: acceptHeaderValue
        }
    });
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const acceptHeaderValue = _.get<string>(pactInteraction.requestHeaders[acceptHeaderName], 'value');
    const producesValue = swaggerOperation.produces.value;

    if (producesValue.length === 0) {
        return acceptHeaderValue
            ? [result.warning({
                message: 'Request accept header is defined but there is no produces definition in the spec',
                pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation
            })]
            : [];
    }

    const foundMatches = newNegotiator(acceptHeaderValue).mediaTypes(producesValue);
    if (foundMatches.length === 0) {
        return [result.error({
            message: 'Accept header is incompatible with the produces mime type defined in the swagger file',
            pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.produces
        })];
    }
    return [];
};

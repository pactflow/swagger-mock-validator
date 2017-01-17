import {ParsedMockInteraction, ParsedSpecOperation} from '../types';
import * as _ from 'lodash';
import Negotiator = require('negotiator');
import result from '../result';

const acceptHeaderName = 'accept';

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const acceptHeaderValue = _.get<string>(pactInteraction.requestHeaders[acceptHeaderName], 'value');
    const producesValue = swaggerOperation.produces.value;
    if (producesValue.length === 0 && acceptHeaderValue) {
        return [result.warning({
            message: 'Request accept header is defined but there is no produces definition in the spec',
            pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })];
    } else if (producesValue.length === 0 && !acceptHeaderValue) {
        return [];
    }
    const negotiator = new Negotiator({
        headers: {
            accept: acceptHeaderValue
        }
    });
    const results = negotiator.mediaTypes(producesValue);
    if (results.length === 0) {
        return [result.error({
            message: 'Accept header is incompatible with the produces mime type defined in the swagger file',
            pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.produces
        })];
    }
    return [];
};

"use strict";
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const acceptHeaderName = 'accept';
const newNegotiator = (acceptHeaderValue) => {
    return new Negotiator({
        headers: {
            accept: acceptHeaderValue
        }
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    const acceptHeaderValue = _.get(pactInteraction.requestHeaders[acceptHeaderName], 'value');
    const producesValue = swaggerOperation.produces.value;
    if (producesValue.length === 0) {
        return acceptHeaderValue
            ? [result_1.default.warning({
                    message: 'Request accept header is defined but there is no produces definition in the spec',
                    pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation
                })]
            : [];
    }
    const foundMatches = newNegotiator(acceptHeaderValue).mediaTypes(producesValue);
    if (foundMatches.length === 0) {
        return [result_1.default.error({
                message: 'Accept header is incompatible with the produces mime type defined in the swagger file',
                pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation.produces
            })];
    }
    return [];
};

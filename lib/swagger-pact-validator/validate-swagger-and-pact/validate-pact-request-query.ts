import * as _ from 'lodash';
import result from '../result';
import {ParsedMockInteraction, ParsedMockValue, ParsedSpecOperation} from '../types';
import validateMockValueAgainstSpec from './validate-mock-value-against-spec';

const getWarningForUndefinedQueryParameter = (
    queryParameterName: string,
    queryParameter: ParsedMockValue<string>,
    swaggerOperation: ParsedSpecOperation
) => {
    return [result.warning({
        message: `Query parameter is not defined in the swagger file: ${queryParameterName}`,
        pactSegment: queryParameter,
        source: 'swagger-pact-validation',
        swaggerSegment: swaggerOperation
    })];

};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    return _(_.keys(pactInteraction.requestQuery))
        .union(_.keys(swaggerOperation.requestQueryParameters))
        .map((name) => {
            const queryParameter = pactInteraction.requestQuery[name];
            const queryParameterDefinition = swaggerOperation.requestQueryParameters[name];

            if (!queryParameterDefinition && queryParameter) {
                return getWarningForUndefinedQueryParameter(name, queryParameter, swaggerOperation);
            }

            return validateMockValueAgainstSpec(queryParameterDefinition, queryParameter, pactInteraction).results;
        })
        .flatten()
        .value();
};

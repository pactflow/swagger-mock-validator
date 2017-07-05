import * as _ from 'lodash';
import q = require('q');
import {
    ParsedMock, ParsedMockInteraction, ParsedSpec, ParsedSpecOperation, ParsedSpecResponse, SpecOperationCoverage
} from './types';
import getParsedSpecOperation from './validate-spec-and-mock/get-parsed-spec-operation';
import getParsedSpecResponse from './validate-spec-and-mock/get-parsed-spec-response';

function getOperationResponses(operation: ParsedSpecOperation): ParsedSpecResponse[] {
    return _.keys(operation.responses).filter((key: string) => {
        return key === 'default' || !Number.isNaN(Number(key));
    }).map((statusCode: any) => operation.responses[statusCode]);
}

function matchSpecOperationResponseForInteraction(
    matchedOperationCoverage: SpecOperationCoverage,
    interaction: ParsedMockInteraction
) {
    const responseResult = getParsedSpecResponse(interaction, matchedOperationCoverage.operation);
    if (responseResult.found) {
        const matchedResponse = _.find(matchedOperationCoverage.responses, (responseCoverage) => {
            return responseCoverage.response === responseResult.value;
        });
        if (matchedResponse) {
            matchedResponse.interactions.push(interaction);
        }
    }
}

function matchSpecOperationForInteraction(
    parsedSpec: ParsedSpec,
    operationsCoverage: SpecOperationCoverage[],
    interaction: ParsedMockInteraction
) {
    const operationResult = getParsedSpecOperation(interaction, parsedSpec);
    if (operationResult.found) {
        const matchedOperationCoverage = _.find(operationsCoverage, (responseCoverage) => {
            return responseCoverage.operation === operationResult.value;
        });
        if (matchedOperationCoverage) {
            matchSpecOperationResponseForInteraction(matchedOperationCoverage, interaction);
        }
    }
}

function collectCoverage(parsedMock: ParsedMock, parsedSpec: ParsedSpec): SpecOperationCoverage[] {
    const operationsCoverage: SpecOperationCoverage[] = _.map(parsedSpec.operations, (operation) => {
        return {
            operation, responses: getOperationResponses(operation).map((response) => {
                return {response, interactions: []};
            })
        };
    });
    _.forEach(parsedMock.interactions, (interaction) => matchSpecOperationForInteraction(
        parsedSpec, operationsCoverage, interaction
    ));
    return operationsCoverage;
}

export default (parsedMock: ParsedMock, parsedSpec: ParsedSpec) => {
    return q.fcall(collectCoverage, parsedMock, parsedSpec);
};

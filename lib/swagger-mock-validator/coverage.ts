import * as _ from 'lodash';
import {
    ParsedMock, ParsedMockInteraction, ParsedSpec, ParsedSpecOperation, ParsedSpecResponse, SpecCoverage,
    SpecOperationCoverage
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
    mock: ParsedMock,
    interaction: ParsedMockInteraction
) {
    const responseResult = getParsedSpecResponse(interaction, matchedOperationCoverage.operation);
    if (responseResult.found) {
        const matchedResponse = _.find(matchedOperationCoverage.responses, (responseCoverage) => {
            return responseCoverage.response === responseResult.value;
        });
        if (matchedResponse) {
            matchedResponse.hits.push({interaction, mock});
        }
    }
}

function matchSpecOperationForInteraction(
    specCoverage: SpecCoverage,
    mock: ParsedMock,
    interaction: ParsedMockInteraction
) {
    const operationResult = getParsedSpecOperation(interaction, specCoverage.spec);
    if (operationResult.found) {
        const matchedOperationCoverage = _.find(specCoverage.operations, (responseCoverage) => {
            return responseCoverage.operation === operationResult.value;
        });
        if (matchedOperationCoverage) {
            matchSpecOperationResponseForInteraction(matchedOperationCoverage, mock, interaction);
        }
    }
}

function init(spec: ParsedSpec): SpecCoverage {
    const operations: SpecOperationCoverage[] = _.map(spec.operations, (operation) => {
        return {
            operation, responses: getOperationResponses(operation).map((response) => {
                return {response, hits: []};
            })
        };
    });
    return {spec, operations};
}

function collectForMock(specCoverage: SpecCoverage, mock: ParsedMock): void {
    _.forEach(mock.interactions, (interaction) => matchSpecOperationForInteraction(
        specCoverage, mock, interaction
    ));
}

export default {
    collectForMock,
    init
};

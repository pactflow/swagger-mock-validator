import * as _ from 'lodash';
import {ParsedMockInteraction, ParsedMockValue} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecOperation} from '../spec-parser/parsed-spec';
import {validateMockValueAgainstSpec} from './validate-mock-value-against-spec';

const queryUsedForSecurity = (queryName: string, parsedSpecOperation: ParsedSpecOperation) =>
    _.some(parsedSpecOperation.securityRequirements, (securityRequirement) =>
        _.some(securityRequirement, (requirement) =>
            requirement.credentialLocation === 'query' && requirement.credentialKey === queryName
        )
    );

const getWarningForUndefinedQueryParameter = (queryName: string,
                                              parsedMockRequestQuery: ParsedMockValue<string>,
                                              parsedSpecOperation: ParsedSpecOperation) => {
    if (queryUsedForSecurity(queryName, parsedSpecOperation)) {
        return [];
    }

    return [result.build({
        code: 'request.query.unknown',
        message: `Query parameter is not defined in the spec file: ${queryName}`,
        mockSegment: parsedMockRequestQuery,
        source: 'spec-mock-validation',
        specSegment: parsedSpecOperation
    })];
};

export const validateParsedMockRequestQuery = (parsedMockInteraction: ParsedMockInteraction,
                                               parsedSpecOperation: ParsedSpecOperation) => {
    return _(_.keys(parsedMockInteraction.requestQuery))
        .union(_.keys(parsedSpecOperation.requestQueryParameters))
        .map((queryName) => {
            const parsedMockRequestQuery = parsedMockInteraction.requestQuery[queryName];
            const parsedSpecRequestQuery = parsedSpecOperation.requestQueryParameters[queryName];

            if (!parsedSpecRequestQuery && parsedMockRequestQuery) {
                return getWarningForUndefinedQueryParameter(queryName, parsedMockRequestQuery, parsedSpecOperation);
            }

            const validationResult = validateMockValueAgainstSpec(
                parsedSpecRequestQuery,
                parsedMockRequestQuery,
                parsedMockInteraction,
                'request.query.incompatible'
            );

            return validationResult.results;
        })
        .flatten()
        .value();
};

import * as _ from 'lodash';
import {ValidationResult} from '../../api-types';
import result from '../result';
import {
    ParsedMockInteraction,
    ParsedSpecOperation,
    ParsedSpecSecurityRequirement,
    ParsedSpecSecurityRequirements
} from '../types';

const validateQueryRequirement = (
    parsedSpecSecurityRequirement: ParsedSpecSecurityRequirement,
    parsedMockInteraction: ParsedMockInteraction
) => {
    if (!parsedMockInteraction.requestQuery[parsedSpecSecurityRequirement.credentialKey]) {
        return result.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the swagger file',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecSecurityRequirement
        });
    }

    return undefined as any;
};

const validateHeaderRequirement = (
    parsedSpecSecurityRequirement: ParsedSpecSecurityRequirement,
    parsedMockInteraction: ParsedMockInteraction
) => {
    if (!parsedMockInteraction.requestHeaders[parsedSpecSecurityRequirement.credentialKey]) {
        return result.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the swagger file',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecSecurityRequirement
        });
    }

    return undefined as any;
};

const validateRequirement = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecSecurityRequirements: ParsedSpecSecurityRequirements
): ValidationResult[] => {
    return _(parsedSpecSecurityRequirements)
        .map((parsedSpecSecurityRequirement) => {
            if (parsedSpecSecurityRequirement.credentialLocation === 'query') {
                return validateQueryRequirement(parsedSpecSecurityRequirement, parsedMockInteraction);
            }

            return validateHeaderRequirement(parsedSpecSecurityRequirement, parsedMockInteraction);
        })
        .compact()
        .value();
};

export default (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): ValidationResult[] => {
    const validationResultsPerRequirement = _(parsedSpecOperation.securityRequirements)
        .map((requirements) => {
            return validateRequirement(parsedMockInteraction, requirements);
        });

    const anySecurityRequirementsMet = validationResultsPerRequirement
        .some((validationResults: ValidationResult[]) => validationResults.length === 0);

    if (anySecurityRequirementsMet) {
        return [];
    }

    return validationResultsPerRequirement.first() || [];
};

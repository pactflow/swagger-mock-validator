import _ from 'lodash';
import {ValidationResult} from '../../api-types';
import {ParsedMockInteraction} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {
    ParsedSpecOperation,
    ParsedSpecSecurityRequirement,
    ParsedSpecSecurityRequirements
} from '../spec-parser/parsed-spec';

const validateQueryRequirement = (
    parsedSpecSecurityRequirement: ParsedSpecSecurityRequirement,
    parsedMockInteraction: ParsedMockInteraction
) => {
    if (!parsedMockInteraction.requestQuery[parsedSpecSecurityRequirement.credentialKey]) {
        return result.build({
            code: 'request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the spec file',
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
            code: 'request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the spec file',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecSecurityRequirement
        });
    }

    return undefined as any;
};

const validateRequirement = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecSecurityRequirement: ParsedSpecSecurityRequirement
): ValidationResult => {
    switch (parsedSpecSecurityRequirement.credentialLocation) {
        case 'header':
            return validateHeaderRequirement(parsedSpecSecurityRequirement, parsedMockInteraction);
        case 'query':
            return validateQueryRequirement(parsedSpecSecurityRequirement, parsedMockInteraction);
        case 'unsupported':
            return undefined as any;
    }
};

const validateRequirements = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecSecurityRequirements: ParsedSpecSecurityRequirements
): ValidationResult[] => {
    return _(parsedSpecSecurityRequirements)
        .map((parsedSpecSecurityRequirement) =>
            validateRequirement(parsedMockInteraction, parsedSpecSecurityRequirement))
        .compact()
        .value();
};

const isBadRequest = (parsedMockInteraction: ParsedMockInteraction) =>
    parsedMockInteraction.responseStatus.value >= 400;

const shouldSkipValidation = (parsedMockInteraction: ParsedMockInteraction) =>
    isBadRequest(parsedMockInteraction);

export const validateParsedSpecSecurity = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): ValidationResult[] => {
    if (shouldSkipValidation(parsedMockInteraction)) {
        return [];
    }

    const validationResultsPerRequirement = _(parsedSpecOperation.securityRequirements)
        .map((requirements) => validateRequirements(parsedMockInteraction, requirements));

    const anySecurityRequirementsMet = validationResultsPerRequirement
        .some((validationResults: ValidationResult[]) => validationResults.length === 0);

    if (anySecurityRequirementsMet) {
        return [];
    }

    return validationResultsPerRequirement.first() || [];
};

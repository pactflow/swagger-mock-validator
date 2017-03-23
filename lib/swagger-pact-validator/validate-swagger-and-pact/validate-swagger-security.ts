import * as _ from 'lodash';
import result from '../result';
import {
    ParsedMockInteraction,
    ParsedSpecOperation,
    ParsedSpecSecurityRequirement,
    ParsedSpecSecurityRequirements,
    ValidationResult
} from '../types';

const validateQueryRequirement = (
    securityRequirement: ParsedSpecSecurityRequirement,
    pactInteraction: ParsedMockInteraction
) => {
    if (!pactInteraction.requestQuery[securityRequirement.credentialKey]) {
        return result.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the swagger file',
            pactSegment: pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: securityRequirement
        });
    }

    return undefined as any;
};

const validateHeaderRequirement = (
    securityRequirement: ParsedSpecSecurityRequirement,
    pactInteraction: ParsedMockInteraction
) => {
    if (!pactInteraction.requestHeaders[securityRequirement.credentialKey]) {
        return result.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the swagger file',
            pactSegment: pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: securityRequirement
        });
    }

    return undefined as any;
};

const validateRequirement = (
    pactInteraction: ParsedMockInteraction,
    requirements: ParsedSpecSecurityRequirements
): ValidationResult[] => {
    return _(requirements)
        .map((requirement) => {
            if (requirement.credentialLocation === 'query') {
                return validateQueryRequirement(requirement, pactInteraction);
            }

            return validateHeaderRequirement(requirement, pactInteraction);
        })
        .compact()
        .value();
};

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation): ValidationResult[] => {
    const validationResults = _(swaggerOperation.securityRequirements)
        .map((requirements) => {
            return validateRequirement(pactInteraction, requirements);
        })
        .value();

    if (_.some(validationResults, (results) => results.length === 0)) {
        return [];
    }

    return _.first(validationResults) || [];
};

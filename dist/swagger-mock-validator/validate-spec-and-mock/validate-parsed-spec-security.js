"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const result_1 = require("../result");
const validateQueryRequirement = (parsedSpecSecurityRequirement, parsedMockInteraction) => {
    if (!parsedMockInteraction.requestQuery[parsedSpecSecurityRequirement.credentialKey]) {
        return result_1.result.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the swagger file',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecSecurityRequirement
        });
    }
    return undefined;
};
const validateHeaderRequirement = (parsedSpecSecurityRequirement, parsedMockInteraction) => {
    if (!parsedMockInteraction.requestHeaders[parsedSpecSecurityRequirement.credentialKey]) {
        return result_1.result.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the swagger file',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecSecurityRequirement
        });
    }
    return undefined;
};
const validateRequirement = (parsedMockInteraction, parsedSpecSecurityRequirements) => {
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
exports.validateParsedSpecSecurity = (parsedMockInteraction, parsedSpecOperation) => {
    const validationResultsPerRequirement = _(parsedSpecOperation.securityRequirements)
        .map((requirements) => {
        return validateRequirement(parsedMockInteraction, requirements);
    });
    const anySecurityRequirementsMet = validationResultsPerRequirement
        .some((validationResults) => validationResults.length === 0);
    if (anySecurityRequirementsMet) {
        return [];
    }
    return validationResultsPerRequirement.first() || [];
};

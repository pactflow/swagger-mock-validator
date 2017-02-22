"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validateQueryRequirement = (securityRequirement, pactInteraction) => {
    if (!pactInteraction.requestQuery[securityRequirement.credentialKey]) {
        return result_1.default.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization query is missing but is required by the swagger file',
            pactSegment: pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: securityRequirement
        });
    }
    return undefined;
};
const validateHeaderRequirement = (securityRequirement, pactInteraction) => {
    if (!pactInteraction.requestHeaders[securityRequirement.credentialKey]) {
        return result_1.default.build({
            code: 'spv.request.authorization.missing',
            message: 'Request Authorization header is missing but is required by the swagger file',
            pactSegment: pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: securityRequirement
        });
    }
    return undefined;
};
const validateRequirement = (pactInteraction, requirements) => {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    const validationResults = _(swaggerOperation.securityRequirements)
        .map((requirements) => {
        return validateRequirement(pactInteraction, requirements);
    })
        .first();
    return validationResults || [];
};

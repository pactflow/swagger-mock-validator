import {ValidationOutcome, ValidationResult} from '../api-types';

export const validatePact = (pactJson: any, mockPathOrUrl: string): ValidationOutcome => {
    let errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    if (!pactJson.interactions) {
        errors = [{
                code: 'pv.error',
                message: 'Missing required property: interactions',
                mockDetails: {
                    interactionDescription: null,
                    interactionState: null,
                    location: '[pactRoot]',
                    mockFile: mockPathOrUrl,
                    value: pactJson
                },
                source: 'pact-validation',
                type: 'error'
            }];
    }
    const success = errors.length === 0;
    const failureReason = success ? undefined : `"${mockPathOrUrl}" is not a valid pact file`;
    return {warnings, errors, failureReason, success};
};

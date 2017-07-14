import * as q from 'q';
import {ValidationOutcome, ValidationResult} from './types';

export default (pactJson: any, mockPathOrUrl: string): q.Promise<ValidationOutcome> => {
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
    const reason = success ? undefined : `"${mockPathOrUrl}" is not a valid pact file`;
    return q({warnings, errors, reason, success});
};

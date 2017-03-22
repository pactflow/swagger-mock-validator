import * as q from 'q';
import {ValidationFailureError} from './types';

export default (pactJson: any, mockPathOrUrl: string, specPathOrUrl: string) => {
    if (!pactJson.interactions) {
        const error = new Error(`"${mockPathOrUrl}" is not a valid pact file`) as ValidationFailureError;

        error.details = {
            errors: [{
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
                specDetails: {
                    location: '[swaggerRoot]',
                    pathMethod: null,
                    pathName: null,
                    specFile: specPathOrUrl,
                    value: null
                },
                type: 'error'
            }],
            warnings: []
        };

        return q.reject(error);
    }

    return q({warnings: []});
};

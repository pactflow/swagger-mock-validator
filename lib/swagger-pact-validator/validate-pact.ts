import * as q from 'q';
import {ValidationFailureError} from './types';

export default (pactJson: any, pactPathOrUrl: string) => {
    if (!pactJson.interactions) {
        const error = new Error(`"${pactPathOrUrl}" is not a valid pact file`) as ValidationFailureError;

        error.details = {
            errors: [{
                message: 'Missing required property: interactions',
                pactDetails: {
                    interactionDescription: null,
                    interactionState: null,
                    location: '[pactRoot]',
                    pactFile: pactPathOrUrl,
                    value: pactJson
                },
                source: 'swagger-validation',
                swaggerDetails: {
                    location: null,
                    pathMethod: null,
                    pathName: null,
                    swaggerFile: null,
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

import * as q from 'q';
import {ValidationFailureError} from './types';

export default (pactJson: any, pactPathOrUrl: string, swaggerPathOrUrl: string) => {
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
                    location: '[swaggerRoot]',
                    pathMethod: null,
                    pathName: null,
                    swaggerFile: swaggerPathOrUrl,
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

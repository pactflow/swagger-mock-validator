import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator-error-impl';
import {Pact} from './types';

export const validateAndResolvePact = (pactJson: any, mockPathOrUrl: string): Pact => {
    if (!pactJson.interactions) {
        throw new SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            `Unable to parse "${mockPathOrUrl}": Missing required property: interactions`
        );
    }

    return pactJson as Pact;
};

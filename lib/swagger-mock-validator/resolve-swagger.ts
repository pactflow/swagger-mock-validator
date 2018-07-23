import * as SwaggerParser from 'swagger-parser';
import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator-error-impl';
import {Swagger} from './types';

export const validateAndResolveSwagger = async (document: any, pathOrUrl: string): Promise<Swagger> => {
    try {
        return await SwaggerParser.validate(document, {
            dereference: {
                circular: 'ignore'
            }
        });
    } catch (error) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            `Unable to parse "${pathOrUrl}"`,
            error
        );
    }
};

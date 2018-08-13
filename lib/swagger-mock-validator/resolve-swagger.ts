import * as SwaggerParser from 'swagger-parser';
import {Swagger2} from './spec-parser/swagger2/swagger2';
import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator-error-impl';

export const validateAndResolveSwagger = async (
    document: any, pathOrUrl: string
): Promise<Swagger2> => {
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

import * as SwaggerParser from '@apidevtools/swagger-parser';
import {SwaggerMockValidatorErrorImpl} from '../swagger-mock-validator-error-impl';
import {Openapi3Schema} from './openapi3/openapi3';
import {Swagger2} from './swagger2/swagger2';

export const validateAndDereferenceSpec = async <T extends Swagger2 | Openapi3Schema>(
    document: any, pathOrUrl: string
): Promise<T> => {
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

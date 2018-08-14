import {SwaggerMockValidatorErrorImpl} from '../../swagger-mock-validator-error-impl';
import {validateAndDereferenceSpec} from '../validate-and-dereference-spec';
import {isSwagger2Content} from './is-swagger2-content';
import {Swagger2} from './swagger2';

const validateSpecFormat = (content: any, pathOrUrl: string): void => {
    if (!isSwagger2Content(content)) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `"${pathOrUrl}" is not a "swagger2" spec`
        );
    }
};

export const validateAndDereferenceSwagger2Spec = async (content: any, pathOrUrl: string): Promise<Swagger2> => {
    validateSpecFormat(content, pathOrUrl);
    return validateAndDereferenceSpec<Swagger2>(content, pathOrUrl);
};

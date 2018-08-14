import {SwaggerMockValidatorErrorImpl} from '../../swagger-mock-validator-error-impl';
import {validateAndDereferenceSpec} from '../validate-and-dereference-spec';
import {isOpenApi3Content} from './is-openapi3-content';
import {Openapi3Schema} from './openapi3';

const validateSpecFormat = (content: any, pathOrUrl: string): void => {
    if (!isOpenApi3Content(content)) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `"${pathOrUrl}" is not a "openapi3" spec`
        );
    }
};

export const validateAndDereferenceOpenApi3Spec = (content: any, pathOrUrl: string): Promise<Openapi3Schema> => {
    validateSpecFormat(content, pathOrUrl);
    return validateAndDereferenceSpec<Openapi3Schema>(content, pathOrUrl);
};

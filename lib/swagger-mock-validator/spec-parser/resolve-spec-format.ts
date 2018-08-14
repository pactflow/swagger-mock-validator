import {SwaggerMockValidatorOptionsSpecType} from '../../api-types';
import {SwaggerMockValidatorErrorImpl} from '../swagger-mock-validator-error-impl';
import {AutoDetectFormat} from '../types';
import {isSwagger2Content} from './swagger2/is-swagger2-content';

const detectContentFormat = (specContent: any): SwaggerMockValidatorOptionsSpecType =>
    isSwagger2Content(specContent) ? 'swagger2' : 'openapi3';

const typeSafeSupportedFormats: {[format in SwaggerMockValidatorOptionsSpecType]: null} = {
    openapi3: null,
    swagger2: null
};

const supportedFormats = Object.keys(typeSafeSupportedFormats);

const isSpecFormat = (unverifiedFormat: string): unverifiedFormat is SwaggerMockValidatorOptionsSpecType =>
    supportedFormats.indexOf(unverifiedFormat) >= 0;

const toVerifiedFormat = (unverifiedFormat: string, pathOrUrl: string): SwaggerMockValidatorOptionsSpecType => {
    if (!isSpecFormat(unverifiedFormat)) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            `"${pathOrUrl}" format "${unverifiedFormat}" is not supported`
        );
    }
    return unverifiedFormat;
};

const autoDetectFormat: AutoDetectFormat = 'auto-detect';

const isAutoDetectFormat = (unverifiedFormat: string): unverifiedFormat is AutoDetectFormat =>
    unverifiedFormat === autoDetectFormat;

export const resolveSpecFormat = (
    unverifiedFormat: string, specJson: any, pathOrUrl: string
): SwaggerMockValidatorOptionsSpecType =>
    isAutoDetectFormat(unverifiedFormat)
        ? detectContentFormat(specJson)
        : toVerifiedFormat(unverifiedFormat, pathOrUrl);

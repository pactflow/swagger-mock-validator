import * as yaml from 'js-yaml';
import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator-error-impl';

const parseJson = <T>(pathOrUrl: string, rawString: string): T => {
    try {
        return JSON.parse(rawString);
    } catch (error) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            `Unable to parse "${pathOrUrl}"`,
            error
        );
    }
};

const parseYaml = <T>(pathOrUrl: string, rawString: string): T => {
    let parsedYaml;

    try {
        parsedYaml = yaml.load(rawString);
    } catch (error) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            `Unable to parse "${pathOrUrl}"`,
            error
        );
    }

    if (!parsedYaml) {
        throw new SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to parse "${pathOrUrl}"`);
    }

    return parsedYaml as any;
};

export function transformStringToObject<T>(rawString: string, pathOrUrl: string): T {
    try {
        return parseJson<T>(pathOrUrl, rawString);
    } catch (parseJsonError) {
        try {
            return parseYaml<T>(pathOrUrl, rawString);
        } catch (parseYamlError) {
            throw parseJsonError;
        }
    }
}

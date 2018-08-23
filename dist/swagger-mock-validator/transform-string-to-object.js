"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml = require("js-yaml");
const swagger_mock_validator_error_impl_1 = require("./swagger-mock-validator-error-impl");
const parseJson = (pathOrUrl, rawString) => {
    try {
        return JSON.parse(rawString);
    }
    catch (error) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to parse "${pathOrUrl}"`, error);
    }
};
const parseYaml = (pathOrUrl, rawString) => {
    let parsedYaml;
    try {
        parsedYaml = yaml.safeLoad(rawString);
    }
    catch (error) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to parse "${pathOrUrl}"`, error);
    }
    if (!parsedYaml) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to parse "${pathOrUrl}"`);
    }
    return parsedYaml;
};
function transformStringToObject(rawString, pathOrUrl) {
    try {
        return parseJson(pathOrUrl, rawString);
    }
    catch (parseJsonError) {
        try {
            return parseYaml(pathOrUrl, rawString);
        }
        catch (parseYamlError) {
            throw parseJsonError;
        }
    }
}
exports.transformStringToObject = transformStringToObject;

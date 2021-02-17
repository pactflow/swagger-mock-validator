"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndResolvePact = void 0;
const swagger_mock_validator_error_impl_1 = require("./swagger-mock-validator-error-impl");
const validateAndResolvePact = (pactJson, mockPathOrUrl) => {
    if (!pactJson.interactions) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to parse "${mockPathOrUrl}": Missing required property: interactions`);
    }
    return pactJson;
};
exports.validateAndResolvePact = validateAndResolvePact;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndDereferenceOpenApi3Spec = void 0;
const swagger_mock_validator_error_impl_1 = require("../../swagger-mock-validator-error-impl");
const validate_and_dereference_spec_1 = require("../validate-and-dereference-spec");
const is_openapi3_content_1 = require("./is-openapi3-content");
const validateSpecFormat = (content, pathOrUrl) => {
    if (!(0, is_openapi3_content_1.isOpenApi3Content)(content)) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `"${pathOrUrl}" is not a "openapi3" spec`);
    }
};
const validateAndDereferenceOpenApi3Spec = (content, pathOrUrl) => {
    validateSpecFormat(content, pathOrUrl);
    return (0, validate_and_dereference_spec_1.validateAndDereferenceSpec)(content, pathOrUrl);
};
exports.validateAndDereferenceOpenApi3Spec = validateAndDereferenceOpenApi3Spec;

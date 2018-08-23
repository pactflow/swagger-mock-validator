"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_mock_validator_error_impl_1 = require("../swagger-mock-validator-error-impl");
const is_swagger2_content_1 = require("./swagger2/is-swagger2-content");
const detectContentFormat = (specContent) => is_swagger2_content_1.isSwagger2Content(specContent) ? 'swagger2' : 'openapi3';
const typeSafeSupportedFormats = {
    openapi3: null,
    swagger2: null
};
const supportedFormats = Object.keys(typeSafeSupportedFormats);
const isSpecFormat = (unverifiedFormat) => supportedFormats.indexOf(unverifiedFormat) >= 0;
const toVerifiedFormat = (unverifiedFormat, pathOrUrl) => {
    if (!isSpecFormat(unverifiedFormat)) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `"${pathOrUrl}" format "${unverifiedFormat}" is not supported`);
    }
    return unverifiedFormat;
};
const autoDetectFormat = 'auto-detect';
const isAutoDetectFormat = (unverifiedFormat) => unverifiedFormat === autoDetectFormat;
exports.resolveSpecFormat = (unverifiedFormat, specJson, pathOrUrl) => isAutoDetectFormat(unverifiedFormat)
    ? detectContentFormat(specJson)
    : toVerifiedFormat(unverifiedFormat, pathOrUrl);

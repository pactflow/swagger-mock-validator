"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_mock_validator_error_impl_1 = require("../../swagger-mock-validator-error-impl");
const validate_and_dereference_spec_1 = require("../validate-and-dereference-spec");
const is_swagger2_content_1 = require("./is-swagger2-content");
const validateSpecFormat = (content, pathOrUrl) => {
    if (!is_swagger2_content_1.isSwagger2Content(content)) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `"${pathOrUrl}" is not a "swagger2" spec`);
    }
};
exports.validateAndDereferenceSwagger2Spec = (content, pathOrUrl) => __awaiter(this, void 0, void 0, function* () {
    validateSpecFormat(content, pathOrUrl);
    return validate_and_dereference_spec_1.validateAndDereferenceSpec(content, pathOrUrl);
});

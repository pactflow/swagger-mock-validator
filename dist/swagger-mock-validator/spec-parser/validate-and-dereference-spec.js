"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndDereferenceSpec = void 0;
const SwaggerParser = require("swagger-parser");
const swagger_mock_validator_error_impl_1 = require("../swagger-mock-validator-error-impl");
const validateAndDereferenceSpec = (document, pathOrUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield SwaggerParser.validate(document, {
            dereference: {
                circular: 'ignore'
            }
        });
    }
    catch (error) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to parse "${pathOrUrl}"`, error);
    }
});
exports.validateAndDereferenceSpec = validateAndDereferenceSpec;

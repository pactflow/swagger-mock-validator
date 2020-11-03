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
const swagger_mock_validator_1 = require("./swagger-mock-validator");
const swaggerMockValidator = {
    validate: (options) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield swagger_mock_validator_1.validateSpecAndMockContent(options);
        return result.validationOutcome;
    })
};
module.exports = swaggerMockValidator;

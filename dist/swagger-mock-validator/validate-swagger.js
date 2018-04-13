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
const _ = require("lodash");
const SwaggerTools = require("swagger-tools-fix-issue-when-object-has-a-length-property");
const validate = (document) => {
    return new Promise((resolve, reject) => {
        SwaggerTools.specs.v2.validate(document, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
    });
};
const generateLocation = (path) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }
    return '[swaggerRoot]';
};
const generateResult = (options) => ({
    code: options.code,
    message: options.message,
    source: 'swagger-validation',
    specDetails: {
        location: options.specLocation,
        pathMethod: null,
        pathName: null,
        specFile: options.specPathOrUrl,
        value: null
    },
    type: options.type
});
const parseValidationResult = (validationResult, specPathOrUrl) => {
    const swaggerToolsErrors = _.get(validationResult, 'errors', []);
    const errors = swaggerToolsErrors.map((swaggerValidationError) => generateResult({
        code: 'sv.error',
        message: swaggerValidationError.message,
        specLocation: generateLocation(swaggerValidationError.path),
        specPathOrUrl,
        type: 'error'
    }));
    const swaggerToolsWarnings = _.get(validationResult, 'warnings', []);
    const warnings = swaggerToolsWarnings.map((swaggerValidationWarning) => generateResult({
        code: 'sv.warning',
        message: swaggerValidationWarning.message,
        specLocation: generateLocation(swaggerValidationWarning.path),
        specPathOrUrl,
        type: 'warning'
    }));
    const success = errors.length === 0;
    const failureReason = success ? undefined : `"${specPathOrUrl}" is not a valid swagger file`;
    return Promise.resolve({ errors, warnings, failureReason, success });
};
exports.validateSwagger = (specJson, specPathOrUrl) => __awaiter(this, void 0, void 0, function* () {
    const validationResult = yield validate(specJson);
    return parseValidationResult(validationResult, specPathOrUrl);
});

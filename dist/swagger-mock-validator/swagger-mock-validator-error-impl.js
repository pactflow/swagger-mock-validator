"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VError = require("verror");
class SwaggerMockValidatorErrorImpl extends VError {
    constructor(code, message, cause) {
        super({ cause }, '%s', message);
        this.code = code;
    }
    toString() {
        return `SwaggerMockValidatorError: { code: ${this.code}, message: ${this.message} }`;
    }
}
exports.SwaggerMockValidatorErrorImpl = SwaggerMockValidatorErrorImpl;

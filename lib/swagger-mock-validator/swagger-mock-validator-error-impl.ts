import * as VError from 'verror';
import {ErrorCode, SwaggerMockValidatorError} from '../api-types';

export class SwaggerMockValidatorErrorImpl extends VError implements SwaggerMockValidatorError {
    public readonly code: ErrorCode;

    public constructor(code: ErrorCode, message: string, cause?: Error) {
        super({cause}, '%s', message);
        this.code = code;
    }

    public toString() {
        return `SwaggerMockValidatorError: { code: ${this.code}, message: ${this.message} }`;
    }
}

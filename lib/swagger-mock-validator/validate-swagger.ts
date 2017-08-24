import * as _ from 'lodash';
import * as SwaggerTools from 'swagger-tools';
import {
    ValidationResultCode} from '../api-types';
import {ValidationResultType} from '../api-types';
import {ValidationOutcome, ValidationResult} from '../api-types';

const validate = (document: any): Promise<SwaggerTools.ValidationResultCollection> => {
    return new Promise((resolve, reject) => {
        SwaggerTools.specs.v2.validate(document, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};

const generateLocation = (path: string[]) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }

    return '[swaggerRoot]';
};

interface GenerateResultOptions {
    code: ValidationResultCode;
    message: string;
    specPathOrUrl: string;
    specLocation: string;
    type: ValidationResultType;
}

const generateResult = (options: GenerateResultOptions): ValidationResult => ({
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

const parseValidationResult = (
    validationResult: SwaggerTools.ValidationResultCollection,
    specPathOrUrl: string
) => {
    const errors: ValidationResult[] = _.get<SwaggerTools.ValidationResult[]>(validationResult, 'errors', [])
        .map((swaggerValidationError) =>
            generateResult({
                code: 'sv.error',
                message: swaggerValidationError.message,
                specLocation: generateLocation(swaggerValidationError.path),
                specPathOrUrl,
                type: 'error'
            })
        );
    const warnings: ValidationResult[] = _.get<SwaggerTools.ValidationResult[]>(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) =>
            generateResult({
                code: 'sv.warning',
                message: swaggerValidationWarning.message,
                specLocation: generateLocation(swaggerValidationWarning.path),
                specPathOrUrl,
                type: 'warning'
            }));

    const success = errors.length === 0;
    const failureReason = success ? undefined : `"${specPathOrUrl}" is not a valid swagger file`;

    return Promise.resolve({errors, warnings, failureReason, success});
};

export default async (specJson: any, specPathOrUrl: string): Promise<ValidationOutcome> => {
    const validationResult = await validate(specJson);

    return parseValidationResult(validationResult, specPathOrUrl);
};

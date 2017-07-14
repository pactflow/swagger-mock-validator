import * as _ from 'lodash';
import * as q from 'q';
import * as SwaggerTools from 'swagger-tools';
import {
    ValidationOutcome, ValidationResult, ValidationResultCode, ValidationResultType
} from './types';

const validate = (document: any): q.Promise<SwaggerTools.ValidationResultCollection> => {
    const deferred = q.defer<SwaggerTools.ValidationResultCollection>();
    SwaggerTools.specs.v2.validate(document, (error, result) => {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(result);
        }
    });

    return deferred.promise;
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
    const reason = success ? undefined : `"${specPathOrUrl}" is not a valid swagger file`;

    return q({errors, warnings, reason, success});
};

export default (specJson: any, specPathOrUrl: string): q.Promise<ValidationOutcome> =>
    validate(specJson)
        .then((validationResult) => parseValidationResult(validationResult, specPathOrUrl));

import * as _ from 'lodash';
import * as q from 'q';
import * as SwaggerTools from 'swagger-tools';
import {ValidationFailureError, ValidationResult, ValidationResultCode, ValidationResultType} from './types';

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
    const validationErrors = _.get<SwaggerTools.ValidationResult[]>(validationResult, 'errors', [])
        .map((swaggerValidationError) =>
            generateResult({
                code: 'sv.error',
                message: swaggerValidationError.message,
                specPathOrUrl,
                specLocation: generateLocation(swaggerValidationError.path),
                type: 'error'
            })
    );

    const validationWarnings = _.get<SwaggerTools.ValidationResult[]>(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) =>
            generateResult({
                code: 'sv.warning',
                message: swaggerValidationWarning.message,
                specPathOrUrl,
                specLocation: generateLocation(swaggerValidationWarning.path),
                type: 'warning'
            })
        );

    if (validationErrors.length > 0) {
        const error = new Error(`"${specPathOrUrl}" is not a valid swagger file`) as ValidationFailureError;

        error.details = {
            errors: validationErrors,
            warnings: validationWarnings
        };

        return q.reject(error);
    }

    return q({warnings: validationWarnings});
};

export default (specJson: any, specPathOrUrl: string) =>
    validate(specJson)
        .then((validationResult) => parseValidationResult(validationResult, specPathOrUrl));

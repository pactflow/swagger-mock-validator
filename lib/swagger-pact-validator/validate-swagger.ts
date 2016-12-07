import * as _ from 'lodash';
import * as q from 'q';
import * as SwaggerTools from 'swagger-tools';
import {ValidationFailureError, ValidationResult, ValidationResultType} from './types';

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

const generateResult = (type: ValidationResultType, message: string, swaggerLocation: string): ValidationResult => ({
    message,
    pactDetails: {
        interactionDescription: null,
        interactionState: '[none]',
        location: '[pactRoot]',
        value: null
    },
    source: 'swagger-validation',
    swaggerDetails: {
        location: swaggerLocation,
        pathMethod: null,
        pathName: null,
        value: null
    },
    type
});

const parseValidationResult = (validationResult: SwaggerTools.ValidationResultCollection, swaggerPathOrUrl: string) => {
    const validationErrors = _.get<SwaggerTools.ValidationResult[]>(validationResult, 'errors', [])
        .map((swaggerValidationError) =>
            generateResult('error', swaggerValidationError.message, generateLocation(swaggerValidationError.path))
    );

    const validationWarnings = _.get<SwaggerTools.ValidationResult[]>(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) =>
            generateResult('warning', swaggerValidationWarning.message, generateLocation(swaggerValidationWarning.path))
        );

    if (validationErrors.length > 0) {
        const error = new Error(`"${swaggerPathOrUrl}" is not a valid swagger file`) as ValidationFailureError;

        error.details = {
            errors: validationErrors,
            warnings: validationWarnings
        };

        return q.reject(error);
    }

    return q({warnings: validationWarnings});
};

export default (swaggerJson: any, swaggerPathOrUrl: string) =>
    validate(swaggerJson).then((validationResult) => parseValidationResult(validationResult, swaggerPathOrUrl));

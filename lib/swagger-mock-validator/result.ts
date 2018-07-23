import {ValidationResult, ValidationResultCode, ValidationResultSource, ValidationResultType} from '../api-types';
import {
ParsedMockValue,
ParsedSpecValue} from './types';

interface ResultOptions {
    code: ValidationResultCode;
    message: string;
    mockSegment: ParsedMockValue<any>;
    source: ValidationResultSource;
    specSegment: ParsedSpecValue<any>;
}

const errorCodes = [
    'request.accept.incompatible',
    'request.authorization.missing',
    'request.body.incompatible',
    'request.content-type.incompatible',
    'request.header.incompatible',
    'request.path-or-method.unknown',
    'request.query.incompatible',
    'response.body.incompatible',
    'response.body.unknown',
    'response.content-type.incompatible',
    'response.header.incompatible',
    'response.header.unknown',
    'response.status.unknown'
];

const codeToType = (code: ValidationResultCode): ValidationResultType =>
    (errorCodes.indexOf(code) > -1) ? 'error' : 'warning';

export const result = {
    build: (options: ResultOptions): ValidationResult => {
        const interaction = options.mockSegment.parentInteraction;
        const operation = options.specSegment.parentOperation;

        return {
            code: options.code,
            message: options.message,
            mockDetails: {
                interactionDescription: interaction.description,
                interactionState: interaction.state,
                location: options.mockSegment.location,
                mockFile: interaction.mockFile,
                value: options.mockSegment.value
            },
            source: options.source,
            specDetails: {
                location: options.specSegment.location,
                pathMethod: operation.method,
                pathName: operation.pathName,
                specFile: operation.specFile,
                value: options.specSegment.value
            },
            type: codeToType(options.code)
        };
    }
};

// tslint:disable:no-namespace
declare namespace SwaggerMockValidator {
    export type ValidationResultSource = 'pact-validation' | 'swagger-validation' | 'spec-mock-validation';

    export type ValidationResultType = 'error' | 'warning';

    export type ValidationResultCode =
        'request.accept.incompatible' |
        'request.accept.unknown' |
        'request.authorization.missing' |
        'request.body.incompatible' |
        'request.body.unknown' |
        'request.content-type.incompatible' |
        'request.content-type.missing' |
        'request.content-type.unknown' |
        'request.header.incompatible' |
        'request.header.unknown' |
        'request.path-or-method.unknown' |
        'request.query.incompatible' |
        'request.query.unknown' |
        'response.body.incompatible' |
        'response.body.unknown' |
        'response.content-type.incompatible' |
        'response.content-type.unknown' |
        'response.header.incompatible' |
        'response.header.undefined' |
        'response.header.unknown' |
        'response.status.default' |
        'response.status.unknown';

    export interface ValidationResultMockDetails {
        interactionDescription: string | null;
        interactionState: string | null;
        location: string;
        mockFile: string;
        value: any;
    }

    export interface ValidationResultSpecDetails {
        location: string;
        pathMethod: string | null;
        pathName: string | null;
        specFile: string;
        value: any;
    }

    export interface ValidationResult {
        code: ValidationResultCode;
        message: string;
        mockDetails?: ValidationResultMockDetails;
        source: ValidationResultSource;
        specDetails?: ValidationResultSpecDetails;
        type: ValidationResultType;
    }

    export interface ValidationOutcome {
        errors: ValidationResult[];
        failureReason?: string;
        success: boolean;
        warnings: ValidationResult[];
    }

    export type SwaggerMockValidatorOptionsSpecType = 'swagger2' | 'openapi3';
    export type SwaggerMockValidatorOptionsMockType = 'pact';

    export interface SwaggerMockValidatorOptionsSpec {
        content: string;
        format: SwaggerMockValidatorOptionsSpecType;
        pathOrUrl: string;
    }

    export interface SwaggerMockValidatorOptionsMock {
        content: string;
        format: SwaggerMockValidatorOptionsMockType;
        pathOrUrl: string;
    }

    export interface SwaggerMockValidatorOptions {
        mock: SwaggerMockValidatorOptionsMock;
        spec: SwaggerMockValidatorOptionsSpec;
    }

    export type ErrorCode =
        'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR' |
        'SWAGGER_MOCK_VALIDATOR_READ_ERROR' |
        'SWAGGER_MOCK_VALIDATOR_UNKNOWN_ERROR';

    export interface SwaggerMockValidatorError extends Error {
        code: ErrorCode;
    }
}

declare interface SwaggerMockValidatorStatic {
    validate: (options: SwaggerMockValidator.SwaggerMockValidatorOptions) =>
        Promise<SwaggerMockValidator.ValidationOutcome>;
}

declare const SwaggerMockValidator: SwaggerMockValidatorStatic;

export = SwaggerMockValidator;

// tslint:disable:no-namespace
declare namespace SwaggerMockValidator {
    export type ValidationResultSource = 'pact-validation' | 'swagger-validation' | 'spec-mock-validation';

    export type ValidationResultType = 'error' | 'warning';

    export type ValidationResultCode =
        'pv.warning' |
        'pv.error' |
        'spv.request.accept.incompatible' |
        'spv.request.accept.unknown' |
        'spv.request.authorization.missing' |
        'spv.request.body.incompatible' |
        'spv.request.body.unknown' |
        'spv.request.content-type.incompatible' |
        'spv.request.content-type.missing' |
        'spv.request.content-type.unknown' |
        'spv.request.header.incompatible' |
        'spv.request.header.unknown' |
        'spv.request.path-or-method.unknown' |
        'spv.request.query.incompatible' |
        'spv.request.query.unknown' |
        'spv.response.body.incompatible' |
        'spv.response.body.unknown' |
        'spv.response.content-type.incompatible' |
        'spv.response.content-type.unknown' |
        'spv.response.header.incompatible' |
        'spv.response.header.undefined' |
        'spv.response.header.unknown' |
        'spv.response.status.default' |
        'spv.response.status.unknown' |
        'sv.error' |
        'sv.warning';

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

    export type SwaggerMockValidatorOptionsSpecType = 'swagger2';
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
}

declare interface SwaggerMockValidatorStatic {
    validate: (options: SwaggerMockValidator.SwaggerMockValidatorOptions) =>
        Promise<SwaggerMockValidator.ValidationOutcome>;
}

declare const SwaggerMockValidator: SwaggerMockValidatorStatic;

export = SwaggerMockValidator;

declare module 'swagger-tools-fix-issue-when-object-has-a-length-property' {
    export interface ValidationResult {
        code: string;
        message: string;
        path: string[];
        description?: string;
    }

    export interface ValidationResultCollection {
        errors: ValidationResult[];
        warnings: ValidationResult[];
    }

    export interface Specification {
        resolve: (document: any, callback: (error?: Error, result?: any) => void) => void;
        validate: (document: any, callback: (error?: Error, result?: ValidationResultCollection) => void) => void;
    }

    export const specs: {v2: Specification};
}

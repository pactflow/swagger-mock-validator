declare module '@apidevtools/swagger-parser' {
    export interface ValidateOptions {
        allow?: {
            json?: boolean;
            yaml?: boolean;
            empty?: boolean;
            unknown?: boolean;
        };
        cache?: {
            fs?: number;
            http?: number;
            https?: number;
        };
        validate?: {
            schema?: boolean;
            spec?: boolean;
        };
        dereference?: {
            internal?: boolean;
            external?: boolean;
            circular?: boolean | 'ignore';
        };
    }

    export function validate(api: any, options?: ValidateOptions): Promise<any>;
}

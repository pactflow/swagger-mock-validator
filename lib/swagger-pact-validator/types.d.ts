import * as q from 'q';

// Parsed Mock

export interface ParsedMock {
    interactions: ParsedMockInteraction[];
    pathOrUrl: string;
}

export interface ParsedMockInteraction extends ParsedMockValue<any> {
    description: string;
    getRequestBodyPath: (path: string) => ParsedMockValue<any>;
    getResponseBodyPath: (path: string) => ParsedMockValue<any>;
    requestBody: ParsedMockValue<any>;
    requestHeaders: ParsedMockHeaderCollection;
    requestMethod: ParsedMockValue<string>;
    requestPath: ParsedMockValue<string>;
    requestPathSegments: Array<ParsedMockValue<string>>;
    responseBody: ParsedMockValue<any>;
    responseHeaders: ParsedMockHeaderCollection;
    responseStatus: ParsedMockValue<number>;
    state: string;
}

export interface ParsedMockHeaderCollection {
    [headerName: string]: ParsedMockValue<string>;
}

export interface ParsedMockValue<T> {
    location: string;
    parentInteraction: ParsedMockInteraction;
    value: T;
}

// Parsed Spec

export interface ParsedSpec {
    operations: ParsedSpecOperation[];
    pathOrUrl: string;
    paths: ParsedSpecValue<any>;
}

export interface ParsedSpecOperation extends ParsedSpecValue<any> {
    headerParameters: ParsedSpecRequestHeaderCollection;
    method: string;
    pathName: string;
    pathNameSegments: ParsedSpecPathNameSegment[];
    requestBodyParameter: ParsedSpecParameter;
    responses: ParsedSpecResponses;
}

export interface ParsedSpecPathNameSegment extends ParsedSpecValue<string> {
    parameter: ParsedSpecParameter;
    type?: string;
    validatorType: ParsedSpecPathNameSegmentValidatorType;
}

export interface ParsedSpecRequestHeaderCollection {
    [headerName: string]: ParsedSpecParameter;
}

export interface ParsedSpecParameter extends ParsedSpecValue<any> {
    getFromSchema: (pathToGet: string) => ParsedSpecValue<any>;
    in: string;
    name: string;
    required?: boolean;
    schema?: JsonSchema;
    type: ParsedSpecParameterType;
}

type ParsedSpecParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

export type ParsedSpecPathNameSegmentValidatorType =
    'boolean' | 'equal' | 'integer' | 'number'| 'string' | 'unsupported';

export interface ParsedSpecResponses extends ParsedSpecValue<any> {
    [statusCode: number]: ParsedSpecResponse;
    default: ParsedSpecResponse;
}

export interface ParsedSpecResponse extends ParsedSpecValue<any> {
    headers: ParsedSpecResponseHeaderCollection;
    getFromSchema: (pathToGet: string) => ParsedSpecValue<any>;
    schema: JsonSchema;
}

export interface ParsedSpecResponseHeaderCollection {
    [headerName: string]: ParsedSpecResponseHeader;
}

export interface ParsedSpecResponseHeader extends ParsedSpecValue<any> {
    type: ParsedSpecResponseHeaderType;
}

export type ParsedSpecResponseHeaderType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

export interface ParsedSpecValue<T> {
    location: string;
    parentOperation: ParsedSpecOperation;
    value: T;
}

// Mock Interfaces - Pact

export interface Pact {
    consumer: {name: string};
    interactions: PactInteraction[];
    metadata: {pactSpecificationVersion: string};
    provider: {name: string};
}

export interface PactInteraction {
    description: string;
    request: PactInteractionRequest;
    response: PactInteractionResponse;
    state?: string;
}

export interface PactInteractionRequest {
    headers?: PactInteractionHeaders;
    body?: any;
    method: string;
    path: string;
}

export interface PactInteractionResponse {
    body?: any;
    headers?: PactInteractionHeaders;
    status: number;
}

export interface PactInteractionHeaders {
    [headerName: string]: string;
}

// Spec Interfaces - Swagger

export interface Swagger {
    info: SwaggerInfo;
    paths: SwaggerPaths;
    swagger: string;
}

export interface SwaggerInfo {
    title: string;
    version: string;
}

export interface SwaggerPaths {
    [path: string]: SwaggerPath;
}

export interface SwaggerPath {
    get?: SwaggerOperation;
    put?: SwaggerOperation;
    post?: SwaggerOperation;
    'delete'?: SwaggerOperation;
    options?: SwaggerOperation;
    head?: SwaggerOperation;
    patch?: SwaggerOperation;
    parameters?: SwaggerParameter[];
}

export interface SwaggerOperation {
    parameters?: SwaggerParameter[];
    responses: SwaggerResponses;
}

export interface SwaggerParameter {
    in: string;
    name: string;
    required?: boolean;
    schema?: JsonSchema;
    type?: SwaggerParameterType;
}

export type SwaggerParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

export interface SwaggerResponses {
    [index: string]: SwaggerResponse;
}

export interface SwaggerResponse {
    description: string;
    headers?: SwaggerResponseHeaderCollection;
    schema?: JsonSchema;
}

export interface SwaggerResponseHeaderCollection {
    [headerName: string]: SwaggerResponseHeader;
}

export interface SwaggerResponseHeader {
    type: SwaggerResponseHeaderType;
}

export type SwaggerResponseHeaderType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

// Other Interfaces

export interface FileSystem {
    readFile: JsonLoaderFunction;
}

export interface HttpClient {
    get: JsonLoaderFunction;
}

export interface JsonLoaderFunction {
    (location: string): q.Promise<string>;
}

export interface JsonSchema {
    additionalProperties?: boolean;
    items?: JsonSchema;
    properties?: JsonSchemaProperties;
    required?: string[];
    type: JsonSchemaType;
}

export type JsonSchemaType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string';

export interface JsonSchemaProperties {
    [name: string]: JsonSchema;
}

export interface SwaggerPactValidator {
    validate: (options: SwaggerPactValidatorOptions) => q.Promise<ValidationSuccess>;
}

export interface SwaggerPactValidatorOptions {
    fileSystem?: FileSystem;
    httpClient?: HttpClient;
    pactPathOrUrl: string;
    swaggerPathOrUrl: string;
}

export interface ValidationSuccess {
    warnings: ValidationResult[];
}

export interface ValidationFailureError extends Error {
    details: {errors: ValidationResult[], warnings: ValidationResult[]};
}

export interface ValidationResult {
    message: string;
    pactDetails: ValidationResultPactDetails;
    source: ValidationResultSource;
    swaggerDetails: ValidationResultSwaggerDetails;
    type: ValidationResultType;
}

export interface ValidationResultPactDetails {
    interactionDescription: string;
    interactionState: string;
    location: string;
    value: any;
}

export interface ValidationResultSwaggerDetails {
    location: string;
    pathMethod: string;
    pathName: string;
    value: any;
}

export type ValidationResultSource = 'swagger-validation' | 'swagger-pact-validation';

export type ValidationResultType = 'error' | 'warning';

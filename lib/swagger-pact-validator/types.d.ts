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
    requestHeaders: ParsedMockValueCollection;
    requestMethod: ParsedMockValue<string>;
    requestPath: ParsedMockValue<string>;
    requestPathSegments: Array<ParsedMockValue<string>>;
    requestQuery: ParsedMockValueCollection;
    responseBody: ParsedMockValue<any>;
    responseHeaders: ParsedMockValueCollection;
    responseStatus: ParsedMockValue<number>;
    pactFile: string;
    state: string;
}

export interface ParsedMockValueCollection {
    [name: string]: ParsedMockValue<string>;
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
    method: string | null;
    pathName: string | null;
    pathNameSegments: ParsedSpecPathNameSegment[];
    requestBodyParameter?: ParsedSpecBody;
    requestHeaderParameters: ParsedSpecParameterCollection;
    requestQueryParameters: ParsedSpecParameterCollection;
    responses: ParsedSpecResponses;
    swaggerFile: string;
}

export interface ParsedSpecPathNameSegment extends ParsedSpecValue<string> {
    parameter: ParsedSpecParameter;
    validatorType: ParsedSpecPathNameSegmentValidatorType;
}

export type ParsedSpecPathNameSegmentValidatorType = 'equal' | 'jsonSchema';

export interface ParsedSpecParameterCollection {
    [headerName: string]: ParsedSpecParameter;
}

export interface ParsedSpecResponses extends ParsedSpecValue<any> {
    [statusCode: number]: ParsedSpecResponse;
    default?: ParsedSpecResponse;
}

export interface ParsedSpecResponse extends ParsedSpecValue<any> {
    headers: ParsedSpecParameterCollection;
    getFromSchema: (pathToGet: string) => ParsedSpecValue<any>;
    schema?: JsonSchema;
}

export interface ParsedSpecParameter extends ParsedSpecValue<any>, ParsedSpecItem {
    name: string;
    required: boolean;
}

export interface ParsedSpecItem {
    collectionFormat?: ParsedSpecItemCollectionFormat;
    enum?: any[];
    exclusiveMaximum?: boolean;
    exclusiveMinimum?: boolean;
    format?: ParsedSpecItemFormat;
    items?: ParsedSpecItem;
    maxItems?: number;
    maxLength?: number;
    maximum?: number;
    minItems?: number;
    minLength?: number;
    minimum?: number;
    multipleOf?: number;
    pattern?: string;
    type: ParsedSpecItemType;
    uniqueItems?: boolean;
}

export interface ParsedSpecBody {
    getFromSchema: (pathToGet: string) => ParsedSpecValue<any>;
    name: string;
    required?: boolean;
    schema: JsonSchema;
}

export type ParsedSpecItemCollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';

export type ParsedSpecItemFormat =
    'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password';

export type ParsedSpecItemType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

export interface ParsedSpecValue<T> {
    location: string;
    parentOperation: ParsedSpecOperation;
    value: T;
}

// Pact Broker

export interface PactBroker {
    _links: PactBrokerLinks;
}

export interface PactBrokerLinks {
    'pb:latest-provider-pacts': PactBrokerLinksLatestProviderPacts;
}

export interface PactBrokerLinksLatestProviderPacts {
    href: string;
}

export interface PactBrokerProviderPacts {
    _links: PactBrokerProviderPactsLinks;
}

export interface PactBrokerProviderPactsLinks {
    pacts: PactBrokerProviderPactsLinksPact[];
}

export interface PactBrokerProviderPactsLinksPact {
    href: string;
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
    providerState?: string;
    provider_state?: string;
}

export interface PactInteractionRequest {
    headers?: PactInteractionHeaders;
    body?: any;
    method: string;
    path: string;
    query?: string;
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

export type SwaggerParameter = SwaggerPathParameter | SwaggerQueryParameter |
    SwaggerRequestHeaderParameter | SwaggerBodyParameter | SwaggerFormParameter;

export interface SwaggerPathParameter extends SwaggerItem {
    in: 'path';
    name: string;
    required: true;
}

export interface SwaggerQueryParameter extends SwaggerItem {
    in: 'query';
    name: string;
    required?: boolean;
}

export interface SwaggerRequestHeaderParameter extends SwaggerItem {
    in: 'header';
    name: string;
    required?: boolean;
}

export interface SwaggerBodyParameter {
    in: 'body';
    name: string;
    required?: boolean;
    schema: JsonSchema;
}

export interface SwaggerFormParameter {
    format?: SwaggerItemFormat;
    in: 'formData';
    name: string;
    required?: boolean;
    type: SwaggerFormParameterType;
}

export type SwaggerFormParameterType = SwaggerItemType | 'file';

export interface SwaggerResponses {
    [index: string]: SwaggerResponse;
}

export interface SwaggerResponse {
    description: string;
    headers?: SwaggerResponseHeaderCollection;
    schema?: JsonSchema;
}

export interface SwaggerResponseHeaderCollection {
    [headerName: string]: SwaggerItem;
}

export interface SwaggerResponseHeader extends SwaggerItem {
    description?: string;
}

export interface SwaggerItem {
    collectionFormat?: SwaggerItemCollectionFormat;
    enum?: any[];
    exclusiveMaximum?: boolean;
    exclusiveMinimum?: boolean;
    format?: SwaggerItemFormat;
    items?: SwaggerItem;
    maxItems?: number;
    maxLength?: number;
    maximum?: number;
    minItems?: number;
    minLength?: number;
    minimum?: number;
    multipleOf?: number;
    pattern?: string;
    type: SwaggerItemType;
    uniqueItems?: boolean;
}

export type SwaggerItemCollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';

export type SwaggerItemFormat =
    'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password';

export type SwaggerItemType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

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
    enum?: any[];
    exclusiveMaximum?: boolean;
    exclusiveMinimum?: boolean;
    format?: JsonSchemaFormat;
    items?: JsonSchema;
    maxItems?: number;
    maxLength?: number;
    maximum?: number;
    minItems?: number;
    minLength?: number;
    minimum?: number;
    multipleOf?: number;
    pattern?: string;
    properties?: JsonSchemaProperties;
    required?: string[];
    type: JsonSchemaType;
    uniqueItems?: boolean;
}

export type JsonSchemaFormat = 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';

export type JsonSchemaType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';

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
    providerName?: string;
    swaggerPathOrUrl: string;
}

export interface ValidationSuccess {
    warnings: ValidationResult[];
}

export interface ValidationFailureError extends Error {
    details: ValidationFailureErrorDetails;
}

export interface ValidationFailureErrorDetails {
    errors: ValidationResult[];
    warnings: ValidationResult[];
}

export interface ValidationResult {
    message: string;
    pactDetails: ValidationResultPactDetails;
    source: ValidationResultSource;
    swaggerDetails: ValidationResultSwaggerDetails;
    type: ValidationResultType;
}

export interface ValidationResultPactDetails {
    interactionDescription: string | null;
    interactionState: string | null;
    location: string;
    pactFile: string;
    value: any;
}

export interface ValidationResultSwaggerDetails {
    location: string;
    pathMethod: string | null;
    pathName: string | null;
    swaggerFile: string;
    value: any;
}

export type ValidationResultSource = 'swagger-validation' | 'swagger-pact-validation';

export type ValidationResultType = 'error' | 'warning';

export interface GetSwaggerValueSuccessResult<T> {
    found: true;
    results: ValidationResult[];
    value: T;
}

export interface GetSwaggerValueFailedResult {
    found: false;
    results: ValidationResult[];
}

export type GetSwaggerValueResult<T> = GetSwaggerValueSuccessResult<T> | GetSwaggerValueFailedResult;

export type MultiCollectionFormatSeparator = '[multi-array-separator]';

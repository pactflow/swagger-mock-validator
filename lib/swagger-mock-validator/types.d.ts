import * as q from 'q';

// Parsed Mock

export interface ParsedMock {
    consumer: string;
    interactions: ParsedMockInteraction[];
    pathOrUrl: string;
    provider: string;
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
    mockFile: string;
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
    produces: ParsedSpecValue<string[]>;
    consumes: ParsedSpecValue<string[]>;
    requestBodyParameter?: ParsedSpecBody;
    requestHeaderParameters: ParsedSpecParameterCollection;
    requestQueryParameters: ParsedSpecParameterCollection;
    responses: ParsedSpecResponses;
    securityRequirements: ParsedSpecSecurityRequirements[];
    specFile: string;
}

export type ParsedSpecPathNameSegment = ParsedSpecPathNameSegmentJsonSchema | ParsedSpecPathNameSegmentEqual;

export interface ParsedSpecPathNameSegmentJsonSchema extends  ParsedSpecValue<string> {
    parameter: ParsedSpecParameter;
    validatorType: 'jsonSchema';
}

export interface ParsedSpecPathNameSegmentEqual extends ParsedSpecValue<string> {
    validatorType: 'equal';
}

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

export type ParsedSpecSecurityRequirements = ParsedSpecSecurityRequirement[];

export interface ParsedSpecSecurityRequirement extends ParsedSpecValue<string[]> {
    credentialKey: string;
    credentialLocation: 'header' | 'query';
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
    basePath?: string;
    info: SwaggerInfo;
    paths: SwaggerPaths;
    produces?: string[];
    consumes?: string[];
    security?: SwaggerSecurityRequirement[];
    securityDefinitions?: SwaggerSecurityDefinitions;
    swagger: string;
}

export interface SwaggerInfo {
    title: string;
    version: string;
}

export interface SwaggerPaths {
    [path: string]: SwaggerPath;
}

export interface SwaggerSecurityDefinitions {
    [name: string]: SwaggerSecurityScheme;
}

export type SwaggerSecurityScheme =
    SwaggerSecuritySchemeBasic | SwaggerSecuritySchemeApiKey | SwaggerSecuritySchemeOAuth2;

export interface SwaggerSecuritySchemeBasic {
    type: 'basic';
}

export interface SwaggerSecuritySchemeApiKey {
    in: 'header' | 'query';
    name: string;
    type: 'apiKey';
}

export interface SwaggerSecuritySchemeOAuth2 {
    authorizationUrl?: string;
    flow: 'accessCode' | 'application' | 'implicit' | 'password';
    tokenUrl?: string;
    scopes: {[scopeName: string]: string};
    type: 'oauth2';
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
    produces?: string[];
    consumes?: string[];
    parameters?: SwaggerParameter[];
    responses: SwaggerResponses;
    security?: SwaggerSecurityRequirement[];
}

export interface SwaggerSecurityRequirement {
    [name: string]: string[];
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
    post: (url: string, body: any) => q.Promise<void>;
}

export interface Metadata {
    getHostname: () => string;
    getOsVersion: () => string;
    getToolVersion: () => string;
    getUptime: () => number;
}

export interface UuidGenerator {
    generate: () => string;
}

export type JsonLoaderFunction = (location: string) => q.Promise<string>;

export interface JsonSchema {
    additionalProperties?: boolean;
    allOf?: JsonSchema[];
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
    type?: JsonSchemaType;
    uniqueItems?: boolean;
}

export type JsonSchemaFormat = 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';

export type JsonSchemaType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';

export interface JsonSchemaProperties {
    [name: string]: JsonSchema;
}

export interface SwaggerMockValidator {
    validate: (options: SwaggerMockValidatorOptions) => q.Promise<ValidationSuccess>;
}

export interface SwaggerMockValidatorOptions {
    analyticsUrl?: string;
    fileSystem?: FileSystem;
    httpClient?: HttpClient;
    metadata?: Metadata;
    mockPathOrUrl: string;
    providerName?: string;
    specPathOrUrl: string;
    uuidGenerator?: UuidGenerator;
}

interface ParsedSwaggerMockValidatorOptions {
    analyticsUrl?: string;
    fileSystem: FileSystem;
    httpClient: HttpClient;
    metadata: Metadata;
    mockPathOrUrl: string;
    mockSource: MockSource;
    providerName?: string;
    specPathOrUrl: string;
    specSource: SpecSource;
    uuidGenerator: UuidGenerator;
}

export type MockSource = 'pactBroker' | 'path' | 'url';

export type SpecSource = 'path' | 'url';

export interface ValidationSuccess {
    warnings: ValidationResult[];
}

export interface ValidationFailureError extends Error {
    details?: ValidationFailureErrorDetails;
}

export interface ValidationFailureErrorDetails {
    errors: ValidationResult[];
    warnings: ValidationResult[];
}

export interface ValidationResult {
    code: ValidationResultCode;
    message: string;
    mockDetails?: ValidationResultMockDetails;
    source: ValidationResultSource;
    specDetails?: ValidationResultSpecDetails;
    type: ValidationResultType;
}

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

export type ValidationResultSource = 'pact-validation' | 'swagger-validation' | 'spec-mock-validation';

export type ValidationResultType = 'error' | 'warning';

export type ValidationResultCode =
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

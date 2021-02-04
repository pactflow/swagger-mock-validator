export interface ParsedSpec {
    operations: ParsedSpecOperation[];
    pathOrUrl: string;
    paths: ParsedSpecValue<any>;
}

export interface ParsedSpecOperation extends ParsedSpecValue<any> {
    method: string | null;
    pathName: string | null;
    pathNameSegments: ParsedSpecPathNameSegment[];
    consumes: ParsedSpecValue<string[]>;
    produces: ParsedSpecValue<string[]>;
    requestBodyParameter?: ParsedSpecBody;
    requestHeaderParameters: ParsedSpecParameterCollection;
    requestQueryParameters: ParsedSpecParameterCollection;
    responses: ParsedSpecResponses;
    securityRequirements: ParsedSpecSecurityRequirements[];
    specFile: string;
}

export type ParsedSpecPathNameSegment = ParsedSpecPathNameSegmentJsonSchema | ParsedSpecPathNameSegmentEqual;

export interface ParsedSpecPathNameSegmentJsonSchema extends ParsedSpecValue<string> {
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

export type ParsedSpecJsonSchema = ParsedSpecJsonSchemaCore | boolean;

export type ParsedSpecJsonSchemaCore = ParsedSpecCustomSwaggerValue &
    ParsedSpecJsonSchemaValue &
    ParsedSpecJsonSchemaReference &
    ParsedSpecJsonSchemaBooleanKeywords;

interface ParsedSpecJsonSchemaReference {
    $ref?: string;
}

interface ParsedSpecJsonSchemaBooleanKeywords {
    allOf?: ParsedSpecJsonSchema[];
    anyOf?: ParsedSpecJsonSchema[];
    oneOf?: ParsedSpecJsonSchema[];
    not?: ParsedSpecJsonSchema;
}

interface ParsedSpecJsonSchemaValue {
    additionalProperties?: boolean | ParsedSpecJsonSchema;
    enum?: any[];
    exclusiveMaximum?: boolean;
    exclusiveMinimum?: boolean;
    format?: ParsedSpecSchemaFormat;
    items?: ParsedSpecJsonSchema;
    maxItems?: number;
    maxLength?: number;
    maximum?: number;
    minItems?: number;
    minLength?: number;
    minimum?: number;
    multipleOf?: number;
    pattern?: string;
    properties?: ParsedSpecJsonSchemaProperties;
    required?: string[];
    type?: ParsedSpecJsonSchemaType | ParsedSpecJsonSchemaType[];
    uniqueItems?: boolean;
}

interface ParsedSpecCustomSwaggerValue {
    definitions?: {
        [name: string]: ParsedSpecJsonSchema;
    };
}

type ParsedSpecSchemaFormat = ParsedSpecJsonSchemaFormat | ParsedSpecOpenApiFormatExtension;

type ParsedSpecJsonSchemaFormat = 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';

type ParsedSpecOpenApiFormatExtension = 'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' |
    'date-time' | 'password';

type ParsedSpecJsonSchemaType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';

interface ParsedSpecJsonSchemaProperties {
    [name: string]: ParsedSpecJsonSchema;
}

export interface ParsedSpecResponse extends ParsedSpecValue<any> {
    headers: ParsedSpecParameterCollection;
    getFromSchema: (pathToGet: string) => ParsedSpecValue<any>;
    schema?: ParsedSpecJsonSchema;
    produces: ParsedSpecValue<string[]>;
}

export type ParsedSpecCollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';

export interface ParsedSpecParameter extends ParsedSpecValue<any> {
    name: string;
    required: boolean;
    schema: ParsedSpecJsonSchemaCore;
    collectionFormat?: ParsedSpecCollectionFormat;
}

export interface ParsedSpecBody {
    getFromSchema: (pathToGet: string) => ParsedSpecValue<any>;
    name: string;
    required?: boolean;
    schema: ParsedSpecJsonSchema;
}

export interface ParsedSpecValue<T> {
    location: string;
    parentOperation: ParsedSpecOperation;
    value: T;
}

export type ParsedSpecSecurityRequirements = ParsedSpecSecurityRequirement[];

export type ParsedSpecCredentialLocation = 'header' | 'query' | 'unsupported';

export interface ParsedSpecSecurityRequirementCredential {
    credentialKey: string;
    credentialLocation: ParsedSpecCredentialLocation;
}

export type ParsedSpecSecurityRequirement =
    ParsedSpecValue<string[]> & ParsedSpecSecurityRequirementCredential;

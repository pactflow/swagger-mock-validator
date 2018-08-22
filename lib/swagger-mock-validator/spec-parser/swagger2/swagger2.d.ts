export interface Swagger2 {
    basePath?: string;
    consumes?: string[];
    definitions?: Swagger2JsonSchemaDefinitions;
    info: Swagger2Info;
    paths: Swagger2Paths;
    produces?: string[];
    parameters?: Swagger2Parameters;
    security?: Swagger2SecurityRequirement[];
    securityDefinitions?: Swagger2SecurityDefinitions;
    swagger: string;
}

export interface Swagger2JsonSchemaDefinitions {
    [name: string]: Swagger2JsonSchema;
}

export interface Swagger2Info {
    title: string;
    version: string;
}

export interface Swagger2Paths {
    [path: string]: Swagger2Path;
}

export interface Swagger2Parameters {
    [name: string]: Swagger2Parameter;
}

export interface Swagger2SecurityDefinitions {
    [name: string]: Swagger2SecurityScheme;
}

export type Swagger2SecurityScheme =
    Swagger2SecuritySchemeBasic | Swagger2SecuritySchemeApiKey | Swagger2SecuritySchemeOAuth2;

export interface Swagger2SecuritySchemeBasic {
    type: 'basic';
}

export interface Swagger2SecuritySchemeApiKey {
    in: 'header' | 'query';
    name: string;
    type: 'apiKey';
}

export interface Swagger2SecuritySchemeOAuth2 {
    authorizationUrl?: string;
    flow: 'accessCode' | 'application' | 'implicit' | 'password';
    tokenUrl?: string;
    scopes: { [scopeName: string]: string };
    type: 'oauth2';
}

export type Swagger2HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch';

export type Swagger2Path = {
    [method in Swagger2HttpMethod]?: Swagger2Operation
} & {
    parameters?: Swagger2Parameter[]
};

export interface Swagger2Operation {
    produces?: string[];
    consumes?: string[];
    parameters?: Swagger2Parameter[];
    responses: Swagger2Responses;
    security?: Swagger2SecurityRequirement[];
}

export interface Swagger2SecurityRequirement {
    [name: string]: string[];
}

export type Swagger2Parameter = Swagger2PathParameter | Swagger2QueryParameter |
    Swagger2RequestHeaderParameter | Swagger2BodyParameter | Swagger2FormParameter;

export interface Swagger2PathParameter extends Swagger2Item {
    in: 'path';
    name: string;
    required: true;
}

export interface Swagger2QueryParameter extends Swagger2Item {
    in: 'query';
    name: string;
    required?: boolean;
}

export interface Swagger2RequestHeaderParameter extends Swagger2Item {
    in: 'header';
    name: string;
    required?: boolean;
}

export interface Swagger2BodyParameter {
    in: 'body';
    name: string;
    required?: boolean;
    schema: Swagger2JsonSchema;
}

export interface Swagger2FormParameter {
    format?: Swagger2ItemFormat;
    in: 'formData';
    name: string;
    required?: boolean;
    type: Swagger2FormParameterType;
}

export type Swagger2FormParameterType = Swagger2ItemType | 'file';

export interface Swagger2Responses {
    [index: string]: Swagger2Response;
}

export interface Swagger2Response {
    description: string;
    headers?: Swagger2ResponseHeaderCollection;
    schema?: Swagger2JsonSchema;
}

export interface Swagger2ResponseHeaderCollection {
    [headerName: string]: Swagger2Item;
}

export interface Swagger2ResponseHeader extends Swagger2Item {
    description?: string;
}

export interface Swagger2Item {
    collectionFormat?: Swagger2ItemCollectionFormat;
    enum?: any[];
    exclusiveMaximum?: boolean;
    exclusiveMinimum?: boolean;
    format?: Swagger2ItemFormat;
    items?: Swagger2Item;
    maxItems?: number;
    maxLength?: number;
    maximum?: number;
    minItems?: number;
    minLength?: number;
    minimum?: number;
    multipleOf?: number;
    pattern?: string;
    type: Swagger2ItemType;
    uniqueItems?: boolean;
}

export type Swagger2ItemCollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';

export type Swagger2ItemFormat =
    'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password';

export type Swagger2ItemType = 'string' | 'number' | 'integer' | 'boolean' | 'array';

export type Swagger2JsonSchema = Swagger2JsonSchemaValue | Swagger2JsonSchemaReference | Swagger2JsonSchemaAllOf;

export interface Swagger2JsonSchemaReference {
    definitions?: Swagger2JsonSchemaDefinitions;
    $ref: string;
}

export interface Swagger2JsonSchemaAllOf {
    allOf: Swagger2JsonSchema[];
    definitions?: Swagger2JsonSchemaDefinitions;
}

export interface Swagger2JsonSchemaValue {
    additionalProperties?: boolean | Swagger2JsonSchema;
    definitions?: Swagger2JsonSchemaDefinitions;
    enum?: any[];
    exclusiveMaximum?: boolean;
    exclusiveMinimum?: boolean;
    format?: Swagger2JsonSchemaFormat;
    items?: Swagger2JsonSchema;
    maxItems?: number;
    maxLength?: number;
    maximum?: number;
    minItems?: number;
    minLength?: number;
    minimum?: number;
    multipleOf?: number;
    pattern?: string;
    properties?: Swagger2JsonSchemaProperties;
    required?: string[];
    type?: Swagger2JsonSchemaType;
    uniqueItems?: boolean;
}

export type Swagger2JsonSchemaFormat = 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';

export type Swagger2JsonSchemaType = 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';

export interface Swagger2JsonSchemaProperties {
    [name: string]: Swagger2JsonSchema;
}

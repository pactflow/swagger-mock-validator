import {cloneDeep} from 'lodash';
import {
    Openapi3Schema,
    SecurityRequirement
} from '../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {addToArrayOn, setValueOn} from './builder-utilities';
import {OpenApi3ParameterBuilder} from './openapi3-builder/openapi3-parameter-builder';
import {OpenApi3PathItemBuilder} from './openapi3-builder/openapi3-path-item-builder';
import {OpenApi3RequestBodyBuilder} from './openapi3-builder/openapi3-request-body-builder';
import {OpenApi3ResponseBuilder} from './openapi3-builder/openapi3-response-builder';
import {OpenApi3ResponseHeaderBuilder} from './openapi3-builder/openapi3-response-header-builder';
import {OpenApi3SchemaBuilder} from './openapi3-builder/openapi3-schema-builder';
import {Openapi3SecuritySchemeBuilder} from './openapi3-builder/openapi3-security-scheme-builder';

const createOpenApi3Builder = (openapi3: Openapi3Schema) => ({
    build: () => cloneDeep(openapi3),
    withHeaderComponent: (name: string, headerBuilder: OpenApi3ResponseHeaderBuilder) =>
        createOpenApi3Builder(setValueOn(openapi3, `components.headers.${name}`, headerBuilder.build())),
    withParameterComponent: (parameterBuilder: OpenApi3ParameterBuilder) => {
        const parameter = parameterBuilder.build();
        return createOpenApi3Builder(setValueOn(openapi3, `components.parameters.${parameter.name}`, parameter));
    },
    withPath: (path: string, pathObjBuilder: OpenApi3PathItemBuilder) =>
        createOpenApi3Builder(setValueOn(openapi3, `paths.${path}`, pathObjBuilder.build())),
    withRequestBodyComponent: (name: string, requestBodyBuilder: OpenApi3RequestBodyBuilder) =>
        createOpenApi3Builder(setValueOn(openapi3, `components.requestBodies.${name}`, requestBodyBuilder.build())),
    withRequestBodyComponentRef: (name: string, reference: string) =>
        createOpenApi3Builder(setValueOn(openapi3, `components.requestBodies.${name}`, {$ref: reference})),
    withResponseComponent: (name: string, responseBodyBuilder: OpenApi3ResponseBuilder) =>
        createOpenApi3Builder(setValueOn(openapi3, `components.responses.${name}`, responseBodyBuilder.build())),
    withSchemaComponent: (name: string, schemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3Builder(setValueOn(openapi3, `components.schemas.${name}`, schemaBuilder.build())),
    withSecurityRequirementNamed: (name: string) => {
        const securityRequirement: SecurityRequirement = {};
        securityRequirement[name] = [];
        return createOpenApi3Builder(addToArrayOn(openapi3, `security`, securityRequirement));
    },
    withSecuritySchemeComponent: (name: string, securitySchemeBuilder: Openapi3SecuritySchemeBuilder) =>
        createOpenApi3Builder(setValueOn(openapi3, `components.securitySchemes.${name}`, securitySchemeBuilder.build()))
});

export const openApi3Builder = createOpenApi3Builder({
    info: {
        title: 'default-title',
        version: '1.0.0'
    },
    openapi: '3.0.0',
    paths: {}
});

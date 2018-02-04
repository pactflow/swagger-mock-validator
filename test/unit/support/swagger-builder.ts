import {cloneDeep} from 'lodash';
import {Swagger, SwaggerSecurityRequirement} from '../../../lib/swagger-mock-validator/types';
import {addToArrayOn, removeValueOn, setValueOn} from './builder-utilities';
import {DefinitionsBuilder} from './swagger-builder/definitions-builder';
import {ParameterBuilder} from './swagger-builder/parameter-builder';
import {PathBuilder} from './swagger-builder/path-builder';
import {SecuritySchemeBuilder} from './swagger-builder/security-scheme-builder';

const createSwaggerBuilder = (swagger: Swagger) => ({
    build: () => cloneDeep(swagger),
    withBasePath: (basePath: string) => createSwaggerBuilder(setValueOn(swagger, 'basePath', basePath)),
    withConsumes: (consumes: string[]) => createSwaggerBuilder(setValueOn(swagger, 'consumes', consumes)),
    withDefinitions: (definitionsBuilder: DefinitionsBuilder) =>
        createSwaggerBuilder(setValueOn(swagger, 'definitions', definitionsBuilder.build())),
    withMissingInfoTitle: () => createSwaggerBuilder(removeValueOn(swagger, 'info.title')),
    withParameter: (name: string, parameterBuilder: ParameterBuilder) => createSwaggerBuilder(
        setValueOn(swagger, `parameters.${name}`, parameterBuilder.build())
    ),
    withPath: (path: string, pathObjBuilder: PathBuilder) =>
        createSwaggerBuilder(setValueOn(swagger, `paths.${path}`, pathObjBuilder.build())),
    withProduces: (produces: string[]) => createSwaggerBuilder(setValueOn(swagger, 'produces', produces)),
    withSecurityDefinitionNamed: (name: string, securitySchemeBuilder: SecuritySchemeBuilder) =>
        createSwaggerBuilder(setValueOn(swagger, `securityDefinitions.${name}`, securitySchemeBuilder.build())),
    withSecurityRequirementNamed: (name: string) => {
        const securityRequirement: SwaggerSecurityRequirement = {};
        securityRequirement[name] = [];
        return createSwaggerBuilder(addToArrayOn(swagger, `security`, securityRequirement));
    }
});

export const swaggerBuilder = createSwaggerBuilder({
    info: {
        title: 'default-title',
        version: '1.0.0'
    },
    paths: {},
    swagger: '2.0'
});

export {definitionsBuilder} from './swagger-builder/definitions-builder';
export {operationBuilder} from './swagger-builder/operation-builder';
export {ParameterBuilder} from './swagger-builder/parameter-builder';
export {bodyParameterBuilder} from './swagger-builder/parameter-builder/body-parameter-builder';
export {pathParameterBuilder} from './swagger-builder/parameter-builder/path-parameter-builder';
export {queryParameterBuilder} from './swagger-builder/parameter-builder/query-parameter-builder';
export {requestHeaderParameterBuilder} from './swagger-builder/parameter-builder/request-header-parameter-builder';
export {pathBuilder} from './swagger-builder/path-builder';
export {responseBuilder} from './swagger-builder/response-builder';
export {responseHeaderBuilder} from './swagger-builder/response-header-builder';
export {schemaBuilder} from './swagger-builder/schema-builder';
export {securitySchemeBuilder} from './swagger-builder/security-scheme-builder';

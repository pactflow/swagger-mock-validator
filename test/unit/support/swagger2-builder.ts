import {cloneDeep} from 'lodash';
import {Swagger2, Swagger2SecurityRequirement} from '../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {addToArrayOn, setValueOn} from './builder-utilities';
import {DefinitionsBuilder} from './swagger2-builder/definitions-builder';
import {ParameterBuilder} from './swagger2-builder/parameter-builder';
import {PathBuilder} from './swagger2-builder/path-builder';
import {SecuritySchemeBuilder} from './swagger2-builder/security-scheme-builder';

const createSwagger2Builder = (swagger: Swagger2) => ({
    build: () => cloneDeep(swagger),
    withBasePath: (basePath: string) => createSwagger2Builder(setValueOn(swagger, 'basePath', basePath)),
    withConsumes: (consumes: string[]) => createSwagger2Builder(setValueOn(swagger, 'consumes', consumes)),
    withDefinitions: (definitionsBuilder: DefinitionsBuilder) =>
        createSwagger2Builder(setValueOn(swagger, 'definitions', definitionsBuilder.build())),
    withParameter: (name: string, parameterBuilder: ParameterBuilder) => createSwagger2Builder(
        setValueOn(swagger, `parameters.${name}`, parameterBuilder.build())
    ),
    withPath: (path: string, pathObjBuilder: PathBuilder) =>
        createSwagger2Builder(setValueOn(swagger, `paths.${path}`, pathObjBuilder.build())),
    withProduces: (produces: string[]) => createSwagger2Builder(setValueOn(swagger, 'produces', produces)),
    withSecurityDefinitionNamed: (name: string, securitySchemeBuilder: SecuritySchemeBuilder) =>
        createSwagger2Builder(setValueOn(swagger, `securityDefinitions.${name}`, securitySchemeBuilder.build())),
    withSecurityRequirementNamed: (name: string) => {
        const securityRequirement: Swagger2SecurityRequirement = {};
        securityRequirement[name] = [];
        return createSwagger2Builder(addToArrayOn(swagger, `security`, securityRequirement));
    }
});

export const swagger2Builder = createSwagger2Builder({
    info: {
        title: 'default-title',
        version: '1.0.0'
    },
    paths: {},
    swagger: '2.0'
});

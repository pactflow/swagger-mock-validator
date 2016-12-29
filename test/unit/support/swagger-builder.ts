import {cloneDeep} from 'lodash';
import {Swagger} from '../../../lib/swagger-pact-validator/types';
import {removeValueOn, setValueOn} from './builder-utilities';
import {ParameterBuilder} from './swagger-builder/parameter-builder';
import {PathBuilder} from './swagger-builder/path-builder';

const createSwaggerBuilder = (swagger: Swagger) => ({
    build: () => cloneDeep(swagger),
    withMissingInfoTitle: () => createSwaggerBuilder(removeValueOn(swagger, 'info.title')),
    withParameter: (name: string, parameterBuilder: ParameterBuilder) => createSwaggerBuilder(
        setValueOn(swagger, `parameters.${name}`, parameterBuilder.build())
    ),
    withPath: (path: string, pathObjBuilder: PathBuilder) =>
        createSwaggerBuilder(setValueOn(swagger, `paths.${path}`, pathObjBuilder.build()))
});

export const swaggerBuilder = createSwaggerBuilder({
    info: {
        title: 'default-title',
        version: '1.0.0'
    },
    paths: {},
    swagger: '2.0'
});

export {default as operationBuilder, OperationBuilder} from './swagger-builder/operation-builder';
export {default as parameterBuilder, ParameterBuilder} from './swagger-builder/parameter-builder';
export {pathParameterBuilder} from './swagger-builder/parameter-builder/path-parameter-builder';
export {default as pathBuilder, PathBuilder} from './swagger-builder/path-builder';
export {default as responseBuilder, ResponseBuilder} from './swagger-builder/response-builder';
export {default as responseHeaderBuilder, ResponseHeaderBuilder} from './swagger-builder/response-header-builder';
export {default as schemaBuilder, SchemaBuilder} from './swagger-builder/schema-builder';

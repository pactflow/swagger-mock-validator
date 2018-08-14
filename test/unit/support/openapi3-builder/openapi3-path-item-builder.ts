import {cloneDeep} from 'lodash';
import {PathItem} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {OpenApi3OperationBuilder} from './openapi3-operation-builder';
import {OpenApi3ParameterBuilder} from './openapi3-parameter-builder';

export interface OpenApi3PathItemBuilder {
    build: () => PathItem;
}

const createOpenApi3PathItemBuilder = (openapi3PathItem: PathItem) => ({
    build: () => cloneDeep(openapi3PathItem),
    withDescription: (description: string) =>
        createOpenApi3PathItemBuilder(setValueOn(openapi3PathItem, 'description', description)),
    withGetOperation: (operationBuilder: OpenApi3OperationBuilder) =>
        createOpenApi3PathItemBuilder(setValueOn(openapi3PathItem, 'get', operationBuilder.build())),
    withParameter: (parameterBuilder: OpenApi3ParameterBuilder) =>
        createOpenApi3PathItemBuilder(addToArrayOn(openapi3PathItem, 'parameters', parameterBuilder.build()))
});

export const openApi3PathItemBuilder = createOpenApi3PathItemBuilder({});

import {cloneDeep} from 'lodash';
import {Swagger2Path} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {OperationBuilder} from './operation-builder';
import {ParameterBuilder} from './parameter-builder';

export interface PathBuilder {
    build: () => Swagger2Path;
}

const createPathBuilder = (path: Swagger2Path) => ({
    build: () => cloneDeep(path),
    withGetOperation: (operationBuilder: OperationBuilder) =>
        createPathBuilder(setValueOn(path, 'get', operationBuilder.build())),
    withParameter: (parameterBuilder: ParameterBuilder) =>
        createPathBuilder(addToArrayOn(path, 'parameters', parameterBuilder.build())),
    withParameterReference: (name: string) => createPathBuilder(
        addToArrayOn(path, 'parameters', {$ref: `#/parameters/${name}`})
    ),
    withPostOperation: (operationBuilder: OperationBuilder) =>
        createPathBuilder(setValueOn(path, 'post', operationBuilder.build())),
    withXProperty: () =>
        createPathBuilder(setValueOn(path, 'x-custom-property', 'custom value'))
});

export const pathBuilder = createPathBuilder({});

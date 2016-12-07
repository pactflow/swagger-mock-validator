import {cloneDeep} from 'lodash';
import {SwaggerPath} from '../../../../lib/swagger-pact-validator/types';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {OperationBuilder} from './operation-builder';
import {ParameterBuilder} from './parameter-builder';

export interface PathBuilder {
    build: () => SwaggerPath;
}

const createPathBuilder = (path: SwaggerPath) => ({
    build: () => cloneDeep(path),
    withGetOperation: (operationBuilder: OperationBuilder) =>
        createPathBuilder(setValueOn(path, 'get', operationBuilder.build())),
    withParameter: (parameterBuilder: ParameterBuilder) =>
        createPathBuilder(addToArrayOn(path, 'parameters', parameterBuilder.build())),
    withParameterReference: (name: string) => createPathBuilder(
        addToArrayOn(path, 'parameters', {$ref: `#/parameters/${name}`})
    ),
    withPostOperation: (operationBuilder: OperationBuilder) =>
        createPathBuilder(setValueOn(path, 'post', operationBuilder.build()))
});

export default createPathBuilder({});

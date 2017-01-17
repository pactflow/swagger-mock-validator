import {cloneDeep} from 'lodash';
import {SwaggerOperation} from '../../../../lib/swagger-pact-validator/types';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {ParameterBuilder} from './parameter-builder';
import * as responseBuilder from './response-builder';

type ResponseBuilder = responseBuilder.ResponseBuilder;
const defaultResponseBuilder = responseBuilder.default;

export interface OperationBuilder {
    build: () => SwaggerOperation;
}

const createOperationBuilder = (operation: SwaggerOperation) => ({
    build: () => cloneDeep(operation),
    withDefaultResponse: (responseBuilder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, 'responses.default', responseBuilder.build())
    ),
    withParameter: (parameterBuilder: ParameterBuilder) => createOperationBuilder(
        addToArrayOn(operation, 'parameters', parameterBuilder.build())
    ),
    withProduces: (produces: string[]) => createOperationBuilder(setValueOn(operation, 'produces', produces)),
    withResponse: (statusCode: number, responseBuilder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, `responses.${statusCode}`, responseBuilder.build())
    )
});

export default createOperationBuilder({responses: {200: defaultResponseBuilder.build()}});

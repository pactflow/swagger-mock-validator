import * as _ from 'lodash';
import {SwaggerOperation, SwaggerSecurityRequirement} from '../../../../lib/swagger-mock-validator/types';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {ParameterBuilder} from './parameter-builder';
import {responseBuilder, ResponseBuilder} from './response-builder';

const defaultResponseBuilder = responseBuilder;

export interface OperationBuilder {
    build: () => SwaggerOperation;
}

const createOperationBuilder = (operation: SwaggerOperation) => ({
    build: () => _.cloneDeep(operation),
    withConsumes: (consumes: string[]) => createOperationBuilder(setValueOn(operation, 'consumes', consumes)),
    withDefaultResponse: (builder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, 'responses.default', builder.build())
    ),
    withParameter: (parameterBuilder: ParameterBuilder) => createOperationBuilder(
        addToArrayOn(operation, 'parameters', parameterBuilder.build())
    ),
    withProduces: (produces: string[]) => createOperationBuilder(setValueOn(operation, 'produces', produces)),
    withResponse: (statusCode: number, builder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, `responses.${statusCode}`, builder.build())
    ),
    withSecurityRequirementNamed: (name: string, scopes?: string[]) => {
        const securityRequirement: SwaggerSecurityRequirement = {};
        securityRequirement[name] = scopes || [];
        return createOperationBuilder(addToArrayOn(operation, `security`, securityRequirement));
    },
    withSecurityRequirementsNamed: (names: string[]) => {
        const securityRequirements: SwaggerSecurityRequirement = {};
        _.each(names, (name) => securityRequirements[name] = []);
        return createOperationBuilder(addToArrayOn(operation, `security`, securityRequirements));
    }
});

export const operationBuilder = createOperationBuilder({responses: {200: defaultResponseBuilder.build()}});

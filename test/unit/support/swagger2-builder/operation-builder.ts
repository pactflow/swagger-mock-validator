import * as _ from 'lodash';
import {
    Swagger2Operation,
    Swagger2SecurityRequirement
} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {ParameterBuilder} from './parameter-builder';
import {responseBuilder, ResponseBuilder} from './response-builder';

const defaultResponseBuilder = responseBuilder;

export interface OperationBuilder {
    build: () => Swagger2Operation;
}

const createOperationBuilder = (operation: Swagger2Operation) => ({
    build: () => _.cloneDeep(operation),
    withConsumes: (consumes: string[]) => createOperationBuilder(setValueOn(operation, 'consumes', consumes)),
    withDefaultResponse: (builder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, 'responses.default', builder.build())
    ),
    withEmptySecurityRequirement: () => createOperationBuilder(addToArrayOn(operation, 'security', {})),
    withParameter: (parameterBuilder: ParameterBuilder) => createOperationBuilder(
        addToArrayOn(operation, 'parameters', parameterBuilder.build())
    ),
    withProduces: (produces: string[]) => createOperationBuilder(setValueOn(operation, 'produces', produces)),
    withResponse: (statusCode: number, builder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, `responses.${statusCode}`, builder.build())
    ),
    withSecurityRequirementNamed: (name: string, scopes?: string[]) => {
        const securityRequirement: Swagger2SecurityRequirement = {};
        securityRequirement[name] = scopes || [];
        return createOperationBuilder(addToArrayOn(operation, 'security', securityRequirement));
    },
    withSecurityRequirementsNamed: (names: string[]) => {
        const securityRequirements: Swagger2SecurityRequirement = {};
        names.forEach((name) => securityRequirements[name] = []);
        return createOperationBuilder(addToArrayOn(operation, 'security', securityRequirements));
    }
});

export const operationBuilder = createOperationBuilder({responses: {200: defaultResponseBuilder.build()}});

import * as _ from 'lodash';
import {SwaggerOperation, SwaggerSecurityRequirement} from '../../../../lib/swagger-mock-validator/types';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import {ParameterBuilder} from './parameter-builder';
import * as responseBuilder from './response-builder';

type ResponseBuilder = responseBuilder.ResponseBuilder;
const defaultResponseBuilder = responseBuilder.default;

export interface OperationBuilder {
    build: () => SwaggerOperation;
}

const createOperationBuilder = (operation: SwaggerOperation) => ({
    build: () => _.cloneDeep(operation),
    withConsumes: (consumes: string[]) => createOperationBuilder(setValueOn(operation, 'consumes', consumes)),
    withDefaultResponse: (responseBuilder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, 'responses.default', responseBuilder.build())
    ),
    withParameter: (parameterBuilder: ParameterBuilder) => createOperationBuilder(
        addToArrayOn(operation, 'parameters', parameterBuilder.build())
    ),
    withProduces: (produces: string[]) => createOperationBuilder(setValueOn(operation, 'produces', produces)),
    withResponse: (statusCode: number, responseBuilder: ResponseBuilder) => createOperationBuilder(
        setValueOn(operation, `responses.${statusCode}`, responseBuilder.build())
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

export default createOperationBuilder({responses: {200: defaultResponseBuilder.build()}});

import {cloneDeep} from 'lodash';
import {
    Operation,
    SecurityRequirement
} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {addToArrayOn, setValueOn} from '../builder-utilities';
import { OpenApi3ParameterBuilder } from './openapi3-parameter-builder';
import {OpenApi3RequestBodyBuilder} from './openapi3-request-body-builder';
import {openApi3ResponseBuilder, OpenApi3ResponseBuilder} from './openapi3-response-builder';

export interface OpenApi3OperationBuilder {
    build: () => Operation;
}

const createOpenApi3OperationBuilder = (openApi3Operation: Operation) => ({
    build: () => cloneDeep(openApi3Operation),
    withEmptySecurityRequirement: () =>
        createOpenApi3OperationBuilder(addToArrayOn(openApi3Operation, 'security', {})),
    withParameter: (parameterBuilder: OpenApi3ParameterBuilder) =>
        createOpenApi3OperationBuilder(addToArrayOn(openApi3Operation, 'parameters', parameterBuilder.build())),
    withParameterRef: (referenceName: string) =>
        createOpenApi3OperationBuilder(addToArrayOn(openApi3Operation, 'parameters', {$ref: referenceName})),
    withRequestBody: (requestBodyBuilder: OpenApi3RequestBodyBuilder) =>
        createOpenApi3OperationBuilder(setValueOn(openApi3Operation, 'requestBody', requestBodyBuilder.build())),
    withRequestBodyRef: (refName: string) =>
        createOpenApi3OperationBuilder(setValueOn(openApi3Operation, 'requestBody.$ref', refName)),
    withResponse: (statusCode: number, responseBuilder: OpenApi3ResponseBuilder) =>
        createOpenApi3OperationBuilder(
            setValueOn(openApi3Operation, `responses.${statusCode}`, responseBuilder.build())),
    withResponseRef: (statusCode: number, refName: string) =>
        createOpenApi3OperationBuilder(setValueOn(openApi3Operation, `responses.${statusCode}`, {$ref: refName})),
    withSecurityRequirementNamed: (name: string) => {
        const securityRequirement: SecurityRequirement = {};
        securityRequirement[name] = [];
        return createOpenApi3OperationBuilder(addToArrayOn(openApi3Operation, 'security', securityRequirement));
    }
});

export const openApi3OperationBuilder = createOpenApi3OperationBuilder({
    responses: {
        200: openApi3ResponseBuilder.build()
    }
});

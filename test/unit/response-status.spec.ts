import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    OperationBuilder,
    pathBuilder,
    responseBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('response status', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with swagger file "swagger.json"';

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateResponseStatus = (pactStatus: number, swaggerOperation: OperationBuilder) => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseStatus(pactStatus)
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(swaggerOperation))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when a pact mocks a response status that is defined in the swagger', async () => {
        const operation = operationBuilder.withResponse(200, responseBuilder);

        const result = await validateResponseStatus(200, operation);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return the error when pact mocks response status not defined in the swagger', async () => {
        const operation = operationBuilder.withResponse(200, responseBuilder);

        const result = await validateResponseStatus(202, operation);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'spv.response.status.unknown',
            message: 'Response status code not defined in swagger file: 202',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].response.status',
                mockFile: 'pact.json',
                value: 202
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: operation.build().responses
            },
            type: 'error'
        }]);
    });

    it('should return warning when pact mocks status matches the swagger default response', async () => {
        const operation = operationBuilder
            .withResponse(200, responseBuilder)
            .withDefaultResponse(responseBuilder);

        const result = await validateResponseStatus(202, operation);

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings([{
            code: 'spv.response.status.default',
            message: 'Response status code matched default response in swagger file: 202',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[pactRoot].interactions[0].response.status',
                mockFile: 'pact.json',
                value: 202
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[swaggerRoot].paths./does/exist.get.responses',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'swagger.json',
                value: operation.build().responses
            },
            type: 'warning'
        }]);
    });
});

import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    OperationBuilder,
    pathBuilder,
    responseBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator response status', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

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

    it('should pass when a pact mocks a response status that is defined in the swagger', willResolve(() => {
        const operation = operationBuilder.withResponse(200, responseBuilder);

        return validateResponseStatus(200, operation).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when pact mocks response status not defined in the swagger', willResolve(() => {
        const operation = operationBuilder.withResponse(200, responseBuilder);

        const result = validateResponseStatus(202, operation);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.response.status.unknown',
                message: 'Response status code not defined in swagger file: 202',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.status',
                    pactFile: 'pact.json',
                    value: 202
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: operation.build().responses
                },
                type: 'error'
            }]);
        });
    }));

    it('should return warning when pact mocks status matches the swagger default response', willResolve(() => {
        const operation = operationBuilder
            .withResponse(200, responseBuilder)
            .withDefaultResponse(responseBuilder);

        return validateResponseStatus(202, operation).then((result) => {
            (expect(result) as any).toContainWarnings([{
                code: 'spv.response.status.default',
                message: 'Response status code matched default response in swagger file: 202',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.status',
                    pactFile: 'pact.json',
                    value: 202
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: operation.build().responses
                },
                type: 'warning'
            }]);
        });
    }));
});

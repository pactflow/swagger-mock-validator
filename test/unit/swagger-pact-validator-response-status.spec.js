'use strict';

const customJasmineMatchers = require('./support/custom-jasmine-matchers');
const expectToReject = require('jasmine-promise-tools').expectToReject;
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const invokeSwaggerPactValidator = require('./support/swagger-pact-validator-loader').invoke;
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator response status', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    const validateResponseStatus = (pactStatus, swaggerOperation) => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseStatus(pactStatus)
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', swaggerBuilder.path.withGetOperation(swaggerOperation))
            .build();

        return invokeSwaggerPactValidator(swaggerFile, pactFile);
    };

    it('should pass when a pact mocks a response status that is defined in the swagger', willResolve(() => {
        const operation = swaggerBuilder.operation.withResponse(200, swaggerBuilder.response);

        return validateResponseStatus(200, operation).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when pact mocks response status not defined in the swagger', willResolve(() => {
        const operation = swaggerBuilder.operation.withResponse(200, swaggerBuilder.response);

        const result = validateResponseStatus(202, operation);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Response status code not defined in swagger file: 202',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.status',
                    value: 202
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: operation.build().responses
                },
                type: 'error'
            }]);
        });
    }));

    it('should return warning when pact mocks status matches the swagger default response', willResolve(() => {
        const operation = swaggerBuilder.operation
            .withResponse(200, swaggerBuilder.response)
            .withDefaultResponse(swaggerBuilder.response);

        return validateResponseStatus(202, operation).then((result) => {
            expect(result).toContainWarnings([{
                message: 'Response status code matched default response in swagger file: 202',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.status',
                    value: 202
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: operation.build().responses
                },
                type: 'warning'
            }]);
        });
    }));
});

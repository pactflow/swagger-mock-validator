'use strict';

const customJasmineMatchers = require('./support/custom-jasmine-matchers');
const expectToReject = require('jasmine-promise-tools').expectToReject;
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const invokeSwaggerPactValidator = require('./support/swagger-pact-validator-loader').invoke;
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator request method', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    it('should pass when a pact calls a method that is defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withRequestMethodGet()
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', swaggerBuilder.path.withGetOperation(swaggerBuilder.operation))
            .build();

        return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact calls a method that is not defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withRequestMethodPost()
            )
            .build();

        const pathWithGetOperationBuilder = swaggerBuilder.path.withGetOperation(swaggerBuilder.operation);

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathWithGetOperationBuilder)
            .build();

        const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Method not defined in swagger file: post',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.method',
                    value: 'post'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist',
                    pathMethod: null,
                    pathName: '/does/exist',
                    value: pathWithGetOperationBuilder.build()
                },
                type: 'error'
            }]);
        });
    }));
});

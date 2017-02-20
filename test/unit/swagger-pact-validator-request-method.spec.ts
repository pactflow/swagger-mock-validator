import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {operationBuilder, pathBuilder, swaggerBuilder} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator request method', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    const invokeSwaggerPactValidator = swaggerPactValidatorLoader.invoke;

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    it('should pass when a pact calls a method that is defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withRequestMethodGet()
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
            .build();

        return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact calls a method that is not defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withRequestMethodPost()
            )
            .build();

        const pathWithGetOperationBuilder = pathBuilder.withGetOperation(operationBuilder);

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathWithGetOperationBuilder)
            .build();

        const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.path-or-method.unknown',
                message: 'Path or method not defined in swagger file: POST /does/exist',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.path',
                    pactFile: 'pact.json',
                    value: '/does/exist'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths',
                    pathMethod: null,
                    pathName: null,
                    swaggerFile: 'swagger.json',
                    value: {'/does/exist': pathWithGetOperationBuilder.build()}
                },
                type: 'error'
            }]);
        });
    }));
});

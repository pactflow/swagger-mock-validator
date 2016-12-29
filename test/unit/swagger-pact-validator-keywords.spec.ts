import {expectToReject, willResolve} from 'jasmine-promise-tools';
import customJasmineMatchers from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    PathBuilder,
    pathBuilder,
    pathParameterBuilder,
    responseBuilder,
    responseHeaderBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator keywords', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    const defaultSwaggerPathBuilder = pathBuilder.withGetOperation(operationBuilder);

    const invokeValidatorWithPath = (swaggerPath: PathBuilder, pactValue: string) => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath(`/${pactValue}`)
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/{value}', swaggerPath)
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    describe('enum', () => {
        const swaggerPathWithEnumBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withStringEnumNamed('value', ['a']));

        it('should pass when the pact path contains an enum value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithEnumBuilder, 'a').then((result) => {
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path does not contain an enum value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithEnumBuilder, 'b');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /b',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/b'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/{value}': swaggerPathWithEnumBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header does not contain an enum value', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/test')
                    .withResponseStatus(200)
                    .withResponseHeader('x-enum-value', 'b')
                )
                .build();

            const responseHeaderWithEnumBuilder = responseHeaderBuilder.withStringEnum(['a']);

            const swaggerFile = swaggerBuilder
                .withPath('/test', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder
                            .withHeader('x-enum-value', responseHeaderWithEnumBuilder)
                        )
                    )
                )
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                        'should be equal to one of the allowed values',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-enum-value',
                        value: 'b'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./test.get.responses.200.headers.x-enum-value',
                        pathMethod: 'get',
                        pathName: '/test',
                        value: responseHeaderWithEnumBuilder.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});

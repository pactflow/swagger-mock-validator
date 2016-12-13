import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as _ from 'lodash';
import customJasmineMatchers from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {operationBuilder, parameterBuilder, pathBuilder, swaggerBuilder} from './support/swagger-builder';
import {ParameterBuilder} from './support/swagger-builder/parameter-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator request headers', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    const validateRequestHeaders = (
        swaggerHeaderParameter: ParameterBuilder,
        pactRequestHeaders: {[name: string]: string}
    ) => {
        let interaction = defaultInteractionBuilder;

        _.each(pactRequestHeaders, (headerValue, headerName) => {
            interaction = interaction.withRequestHeader(headerName, headerValue);
        });

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const operation = swaggerHeaderParameter
            ? operationBuilder.withParameter(swaggerHeaderParameter)
            : operationBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request header matches the spec', willResolve(() => {
        const requestHeaders = {'x-custom-header': '1'};
        const headerParameter = parameterBuilder.withRequiredNumberInHeaderNamed('x-custom-header');

        return validateRequestHeaders(headerParameter, requestHeaders).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when the pact request header does not match the spec', willResolve(() => {
        const requestHeaders = {'x-custom-header': 'not-a-number'};
        const headerParameter = parameterBuilder.withRequiredNumberInHeaderNamed('x-custom-header');

        const result = validateRequestHeaders(headerParameter, requestHeaders);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Request header is incompatible with the header parameter defined ' +
                'in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.x-custom-header',
                    value: 'not-a-number'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: headerParameter.build()
                },
                type: 'error'
            }]);
        });
    }));

    it('should return a warning when the spec uses the array type', willResolve(() => {
        const requestHeaders = {'x-custom-header': '1,2,3'};
        const headerParameter = parameterBuilder.withRequiredArrayOfNumbersInHeaderNamed('x-custom-header');

        return validateRequestHeaders(headerParameter, requestHeaders).then((result) => {
            (expect(result) as any).toContainWarnings([{
                message:
                    'Validating headers of type "array" are not supported, assuming value is valid: x-custom-header',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.x-custom-header',
                    value: '1,2,3'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: headerParameter.build()
                },
                type: 'warning'
            }]);
        });
    }));

    it('should pass when the pact request header is missing and the spec defines it as optional', willResolve(() => {
        const headerParameter = parameterBuilder.withOptionalNumberInHeaderNamed('x-custom-header');

        return validateRequestHeaders(headerParameter, {}).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should fail when the pact request header is missing and the spec defines it as required', willResolve(() => {
        const headerParameter = parameterBuilder.withRequiredNumberInHeaderNamed('x-custom-header');

        const result = validateRequestHeaders(headerParameter, {});

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Request header is incompatible with the header parameter defined ' +
                'in the swagger file: should have required property \'value\'',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: headerParameter.build()
                },
                type: 'error'
            }]);
        });
    }));

    it('should fail when a pact request header is defined that is not in the spec', willResolve(() => {
        const requestHeaders = {'x-custom-header': 'value'};

        const result = validateRequestHeaders(null, requestHeaders);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Request header is not defined in the swagger file: x-custom-header',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.x-custom-header',
                    value: 'value'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: operationBuilder.build()
                },
                type: 'error'
            }]);
        });
    }));
});

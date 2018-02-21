import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerBuilder} from './support/swagger-builder';
import {operationBuilder} from './support/swagger-builder/operation-builder';
import {pathBuilder} from './support/swagger-builder/path-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('produces', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with swagger file "swagger.json"';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    describe('request accepts', () => {
        const validateRequestAcceptHeader = (swaggerProduces?: string[],
                                             pactRequestAcceptHeaderValue?: string) => {

            const interaction = pactRequestAcceptHeaderValue
                ? defaultInteractionBuilder.withRequestHeader('Accept', pactRequestAcceptHeaderValue)
                : defaultInteractionBuilder;

            const pactFile = pactBuilder.withInteraction(interaction).build();

            const operation = swaggerProduces
                ? operationBuilder.withProduces(swaggerProduces)
                : operationBuilder;

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder.withGetOperation(operation))
                .build();

            return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
        };

        it('should pass when the pact request accept header matches the spec', async () => {
            const result = await validateRequestAcceptHeader(['application/json'], 'application/json');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact request accept header is more generous then the spec', async () => {
            const result = await validateRequestAcceptHeader(['application/json;charset=utf-8'], 'application/json');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact request accept header is not defined', async () => {
            const result = await validateRequestAcceptHeader(['application/json']);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when neither pact request header, nor spec produces is defined', async () => {
            const result = await validateRequestAcceptHeader();

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return a warning when request accept header is defined and spec produces is not', async () => {
            const result = await validateRequestAcceptHeader(undefined, 'application/json');

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'spv.request.accept.unknown',
                message: 'Request Accept header is defined but there is no produces definition in the spec',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        });

        it('should return the error when the pact request accept header does not match the spec', async () => {
            const result = await validateRequestAcceptHeader(['application/xml'], 'application/json');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.request.accept.incompatible',
                message: 'Request Accept header is incompatible with the produces mime type ' +
                'defined in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });

        it('should return an error when pact request accept header is more restrictive then the spec', async () => {
            const result = await validateRequestAcceptHeader(['application/json'], 'application/json;charset=utf-8');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.request.accept.incompatible',
                message: 'Request Accept header is incompatible with the produces mime type ' +
                'defined in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json;charset=utf-8'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/json']
                },
                type: 'error'
            }]);
        });

        it('should return the error when the request accept header does not match the global spec', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder.withRequestHeader('Accept', 'application/json'))
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
                .withProduces(['application/xml'])
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.request.accept.incompatible',
                message: 'Request Accept header is incompatible with the produces mime type ' +
                'defined in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });

        it('should use the operation produces over the global produces', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder.withRequestHeader('Accept', 'application/json'))
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder.withProduces(['application/xml']))
                )
                .withProduces(['application/json'])
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.request.accept.incompatible',
                message: 'Request Accept header is incompatible with the produces mime type ' +
                'defined in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    });

    describe('response content type', () => {
        const validateResponseContentType = (swaggerProduces?: string[], pactResponseContentTypeValue?: string) => {
            let interaction = defaultInteractionBuilder.withRequestMethodPost();

            if (pactResponseContentTypeValue) {
                interaction = interaction.withResponseHeader('Content-Type', pactResponseContentTypeValue);
            }

            const pactFile = pactBuilder.withInteraction(interaction).build();

            const operation = swaggerProduces
                ? operationBuilder.withProduces(swaggerProduces)
                : operationBuilder;

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder.withPostOperation(operation))
                .build();

            return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
        };

        it('should pass when the pact response content type header matches the spec', async () => {
            const result = await validateResponseContentType(['application/json'], 'application/json');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact response content type header is missing', async () => {
            const result = await validateResponseContentType(['application/json']);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the response content type can be negotiated', async () => {
            const result = await validateResponseContentType(['application/json; charset=utf-8'], 'application/json');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when there is no pact response content type and no produces', async () => {
            const result = await validateResponseContentType();

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return a warning when there is no produces and a content type', async () => {
            const result = await validateResponseContentType(undefined, 'application/json');

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'spv.response.content-type.unknown',
                message: 'Response Content-Type header is defined but there is no produces definition in the spec',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        });

        it('should return the error when response content-type header does not match the spec', async () => {
            const result = await validateResponseContentType(['application/xml'], 'application/json');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.content-type.incompatible',
                message: 'Response Content-Type header is incompatible with the produces mime type defined ' +
                'in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post.produces',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });

        it('should return the error when the response content-type cannot be negotiated', async () => {
            const result = await validateResponseContentType(['application/json'], 'application/json; charset=utf-8');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.content-type.incompatible',
                message: 'Response Content-Type header is incompatible with the produces mime type defined ' +
                'in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json; charset=utf-8'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post.produces',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/json']
                },
                type: 'error'
            }]);
        });
    });
});

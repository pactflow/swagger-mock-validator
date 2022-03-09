import {ValidationOutcome} from '../../lib/api-types';
import {Swagger2HttpMethod} from '../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {pathBuilder} from './support/swagger2-builder/path-builder';
import {responseBuilder} from './support/swagger2-builder/response-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('produces', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    it('should return status unknown error, if pact response status does not match spec response status', async () => {
        const interaction = defaultInteractionBuilder
            .withResponseStatus(202)
            .withRequestPath('/does/exist')
            .withResponseHeader('Content-Type', 'application/json')
            .withRequestHeader('Accept', 'application/json');
        const pactFile = pactBuilder
            .withInteraction(interaction).build();

        const operation = operationBuilder
            .withResponse(200, responseBuilder)
            .withProduces(['application/json']);

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.errors.length).toBe(1);
        expect(result.errors[0].code).toBe('response.status.unknown');
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

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder.withGetOperation(operation))
                .build();

            return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
        };

        it('should pass when the pact request accept header matches the spec', async () => {
            const result = await validateRequestAcceptHeader(
                ['text/html', 'application/json;charset=utf-8'], 'application/json'
            );

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

        it('should pass when the accept header has multiple types and at least one matches the spec', async () => {
            const result = await validateRequestAcceptHeader(
                ['text/html', 'application/json;charset=utf-8'], 'image/png, application/json'
            );

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return a warning when request accept header is defined and spec produces is not', async () => {
            const result = await validateRequestAcceptHeader(undefined, 'application/json');

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'request.accept.unknown',
                message: 'Request Accept header is defined but the spec does not specify any mime-types to produce',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        });

        it('should return the error when the pact request accept header does not match the spec', async () => {
            const result = await validateRequestAcceptHeader(['application/xml'], 'application/json');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.accept.incompatible',
                message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });

        it('should return the error when the request accept header does not match the global spec', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder.withRequestHeader('Accept', 'application/json'))
                .build();

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
                .withProduces(['application/xml'])
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.accept.incompatible',
                message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });

        it('should use the operation produces over the global produces', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder.withRequestHeader('Accept', 'application/json'))
                .build();

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder.withProduces(['application/xml']))
                )
                .withProduces(['application/json'])
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.accept.incompatible',
                message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    });

    describe('response content type', () => {
        const validateResponseContentType = (
            options: {specProduces?: string[], mockResponseContentType?: string, method?: Swagger2HttpMethod}
        ): Promise<ValidationOutcome> => {
            const method: Swagger2HttpMethod = options.method ?? 'post';

            let interaction = defaultInteractionBuilder.withRequestMethod(method);
            if (options.mockResponseContentType) {
                interaction = interaction.withResponseHeader('Content-Type', options.mockResponseContentType);

            }

            const pactFile = pactBuilder.withInteraction(interaction).build();

            const operation = options.specProduces
                ? operationBuilder.withProduces(options.specProduces)
                : operationBuilder;

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder.withOperation(method, operation))
                .build();

            return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
        };

        it('should pass when the pact response content type header matches the spec', async () => {
            const result = await validateResponseContentType({
                specProduces: ['text/html', 'application/json; charset=utf-8'],
                mockResponseContentType: 'application/json'
            });

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact response content type header is missing', async () => {
            const result = await validateResponseContentType({
                specProduces: ['application/json'],
                mockResponseContentType: undefined
            });

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when there is no pact response content type and no produces', async () => {
            const result = await validateResponseContentType({
                specProduces: undefined,
                mockResponseContentType: undefined
            });

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return a warning when there is no produces and content type is defined', async () => {
            const result = await validateResponseContentType({
                specProduces: undefined,
                mockResponseContentType: 'application/json'
            });

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'response.content-type.unknown',
                message: 'Response Content-Type header is defined but the spec does not specify any mime-types ' +
                'to produce',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.post',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        });

        it('should pass when content type is defined and there is no produces but method is HEAD', async () => {
            const result = await validateResponseContentType({
                specProduces: undefined,
                mockResponseContentType: 'application/json',
                method: 'head'
            });

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when response content-type header does not match the spec', async () => {
            const result = await validateResponseContentType({
                specProduces: ['application/xml'],
                mockResponseContentType: 'application/json'
            });

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.content-type.incompatible',
                message: 'Response Content-Type header is incompatible with the mime-types the spec defines to produce',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.post.produces',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    });
});

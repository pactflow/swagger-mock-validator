import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    bodyParameterBuilder,
    operationBuilder,
    pathBuilder,
    schemaBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('consumes', () => {
    const expectedFailedValidationError =
        new Error('Mock file "pact.json" is not compatible with swagger file "swagger.json"');
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withRequestMethodPost()
        .withResponseStatus(200);
    const defaultSwaggerBodyParameter = bodyParameterBuilder.withOptionalSchema(schemaBuilder
        .withTypeObject()
        .withRequiredProperty('id', schemaBuilder.withTypeNumber())
    );

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateRequestContentTypeHeader = (
        swaggerConsumes?: string[],
        pactRequestContentTypeHeaderValue?: string,
        pactRequestBody?: any
    ) => {
        let interaction = defaultInteractionBuilder;

        if (pactRequestBody) {
            interaction = interaction.withRequestBody(pactRequestBody);
        }

        if (pactRequestContentTypeHeaderValue) {
            interaction = interaction.withRequestHeader('Content-Type', pactRequestContentTypeHeaderValue);
        }

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const operation = swaggerConsumes
            ? operationBuilder.withConsumes(swaggerConsumes)
            : operationBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist',
                pathBuilder.withPostOperation(operation.withParameter(defaultSwaggerBodyParameter)))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request content-type header matches the spec', willResolve(() =>
        validateRequestContentTypeHeader(['application/json'], 'application/json', {id: 1}).then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should pass when the pact request has no body and content-type header matches the spec', willResolve(() =>
        validateRequestContentTypeHeader(['application/json'], 'application/json').then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should pass when no pact request content-type and no body are defined', willResolve(() =>
        validateRequestContentTypeHeader(['application/json']).then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should pass when no pact request content-type and no spec consumes are defined', willResolve(() =>
        validateRequestContentTypeHeader().then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should pass for request with body and no content-type and when no spec consumes is defined', willResolve(() =>
        validateRequestContentTypeHeader(undefined, undefined, {id: 2}).then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should return warning when request content-type header is not defined and spec consumes is', willResolve(() =>
        validateRequestContentTypeHeader(['application/json'], undefined, {id: 1}).then((result) => {
            expect(result).toContainWarnings([{
                code: 'spv.request.content-type.missing',
                message: 'Request content type header is not defined but there is consumes definition in the spec',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    mockFile: 'pact.json',
                    value: defaultInteractionBuilder.withRequestBody({id: 1}).build()
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post.consumes',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/json']
                },
                type: 'warning'
            }]);
        })
    ));

    it('should return warning when request content-type header is defined and spec consumes is not', willResolve(() =>
        validateRequestContentTypeHeader(undefined, 'application/json', {id: 1}).then((result) => {
            expect(result).toContainWarnings([{
                code: 'spv.request.content-type.unknown',
                message: 'Request content-type header is defined but there is no consumes definition in the spec',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: operationBuilder.withParameter(defaultSwaggerBodyParameter).build()
                },
                type: 'warning'
            }]);
        })
    ));

    it('should return error when pact request content-type header does not match the spec', willResolve(() => {
        const result = validateRequestContentTypeHeader(['application/xml'], 'application/json', {id: 1});

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the consumes mime type defined ' +
                'in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post.consumes',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    }));

    it('should return error when pact request content-type header does not match the global spec', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('Content-Type', 'application/json'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withPostOperation(operationBuilder))
            .withConsumes(['application/xml'])
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the consumes mime type defined in the ' +
                'swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].consumes',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    }));

    it('should use the operation produces over the global produces', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('Content-Type', 'application/json'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withPostOperation(operationBuilder.withConsumes(['application/xml'])))
            .withConsumes(['application/json'])
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                code: 'spv.request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the consumes mime ' +
                'type defined in the swagger file',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.post.consumes',
                    pathMethod: 'post',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    }));
});

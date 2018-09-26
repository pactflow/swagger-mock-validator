import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {bodyParameterBuilder} from './support/swagger2-builder/parameter-builder/body-parameter-builder';
import {pathBuilder} from './support/swagger2-builder/path-builder';
import {schemaBuilder} from './support/swagger2-builder/schema-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

interface ValidationOptions {
    swaggerConsumes?: string[];
    pactRequestContentTypeHeaderValue?: string;
    pactRequestBody?: any;
}

describe('consumes', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';
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

    const validateRequestContentTypeHeader = (options: ValidationOptions) => {
        let interaction = defaultInteractionBuilder;

        if (options.pactRequestBody) {
            interaction = interaction.withRequestBody(options.pactRequestBody);
        }

        if (options.pactRequestContentTypeHeaderValue) {
            interaction = interaction.withRequestHeader('Content-Type', options.pactRequestContentTypeHeaderValue);
        }

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const operation = options.swaggerConsumes
            ? operationBuilder.withConsumes(options.swaggerConsumes)
            : operationBuilder;

        const swaggerFile = swagger2Builder
            .withPath('/does/exist',
                pathBuilder.withPostOperation(operation.withParameter(defaultSwaggerBodyParameter)))
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request content-type header matches the spec', async () => {
        const result = await validateRequestContentTypeHeader({
            pactRequestBody: {id: 1},
            pactRequestContentTypeHeaderValue: 'application/json',
            swaggerConsumes: ['application/json']
        });

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when the pact request has no body and content-type header matches the spec', async () => {
        const result = await validateRequestContentTypeHeader({
            pactRequestContentTypeHeaderValue: 'application/json; charset=utf-8',
            swaggerConsumes: ['application/xml', 'application/json']
        });

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when no pact request content-type and no body are defined', async () => {
        const result = await validateRequestContentTypeHeader({swaggerConsumes: ['application/json']});

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when no pact request content-type and no spec consumes are defined', async () => {
        const result = await validateRequestContentTypeHeader({});

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass for request with body and no content-type and when no spec consumes is defined', async () => {
        const result = await validateRequestContentTypeHeader({pactRequestBody: {id: 2}});

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return warning when request content-type header is not defined and spec consumes is', async () => {
        const result = await validateRequestContentTypeHeader({
            pactRequestBody: {id: 1},
            swaggerConsumes: ['application/json']
        });

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings([{
            code: 'request.content-type.missing',
            message: 'Request content type header is not defined but spec specifies mime-types to consume',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.withRequestBody({id: 1}).build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.post.consumes',
                pathMethod: 'post',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: ['application/json']
            },
            type: 'warning'
        }]);
    });

    it('should return warning when request content-type header is defined and spec consumes is not', async () => {
        const result = await validateRequestContentTypeHeader({
            pactRequestBody: {id: 1},
            pactRequestContentTypeHeaderValue: 'application/json'
        });

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings([{
            code: 'request.content-type.unknown',
            message: 'Request content-type header is defined but the spec does not specify any mime-types to consume',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.headers.Content-Type',
                mockFile: 'pact.json',
                value: 'application/json'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.post',
                pathMethod: 'post',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: operationBuilder.withParameter(defaultSwaggerBodyParameter).build()
            },
            type: 'warning'
        }]);
    });

    it('should return error when pact request content-type header does not match the spec', async () => {
        const result = await validateRequestContentTypeHeader({
            pactRequestBody: {id: 1},
            pactRequestContentTypeHeaderValue: 'application/json',
            swaggerConsumes: ['application/xml']
        });

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.content-type.incompatible',
            message: 'Request Content-Type header is incompatible with the mime-types the spec accepts to consume',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.headers.Content-Type',
                mockFile: 'pact.json',
                value: 'application/json'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.post.consumes',
                pathMethod: 'post',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: ['application/xml']
            },
            type: 'error'
        }]);
    });

    it('should return error when pact request content-type header does not match the global spec', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('Content-Type', 'application/json'))
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder.withPostOperation(operationBuilder))
            .withConsumes(['application/xml'])
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.content-type.incompatible',
            message: 'Request Content-Type header is incompatible with the mime-types the spec accepts to consume',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.headers.Content-Type',
                mockFile: 'pact.json',
                value: 'application/json'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].consumes',
                pathMethod: 'post',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: ['application/xml']
            },
            type: 'error'
        }]);
    });

    it('should use the operation consumes over the global consumes', async () => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('Content-Type', 'application/json'))
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder.withPostOperation(operationBuilder.withConsumes(['application/xml'])))
            .withConsumes(['application/json'])
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.content-type.incompatible',
            message: 'Request Content-Type header is incompatible with the mime-types the spec accepts to consume',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.headers.Content-Type',
                mockFile: 'pact.json',
                value: 'application/json'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.post.consumes',
                pathMethod: 'post',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: ['application/xml']
            },
            type: 'error'
        }]);
    });
});

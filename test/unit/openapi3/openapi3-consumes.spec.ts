import {CustomMatchers, customMatchers} from '../support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from '../support/pact-builder';
import {swaggerBuilder} from '../support/swagger-builder';
import {operationBuilder} from '../support/swagger-builder/operation-builder';
import {bodyParameterBuilder} from '../support/swagger-builder/parameter-builder/body-parameter-builder';
import {pathBuilder} from '../support/swagger-builder/path-builder';
import {schemaBuilder} from '../support/swagger-builder/schema-builder';
import {swaggerMockValidatorLoader} from '../support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('openapi3/consumes', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with swagger file "swagger.json"';
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
        requestBodyMimeTypes?: string[],
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

        const operation = requestBodyMimeTypes
            ? operationBuilder.withConsumes(requestBodyMimeTypes)
            : operationBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist',
                pathBuilder.withPostOperation(operation.withParameter(defaultSwaggerBodyParameter)))
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the spec has multiple request body mine types', async () => {
        const result = await validateRequestContentTypeHeader(
            ['application/xml', 'application/json;charset=utf-8'], 'application/json;charset=utf-8'
        );

        expect(result).toContainNoWarningsOrErrors();
    });

    // it('should pass when no pact request content-type and no spec consumes are defined', async () => {
    //     const result = await validateRequestContentTypeHeader();

    //     expect(result).toContainNoWarningsOrErrors();
    // });

    // it('should return error when pact request content-type header does not match the global spec', async () => {
    //     const pactFile = pactBuilder
    //         .withInteraction(defaultInteractionBuilder.withRequestHeader('Content-Type', 'application/json'))
    //         .build();

    //     const swaggerFile = swaggerBuilder
    //         .withPath('/does/exist', pathBuilder.withPostOperation(operationBuilder))
    //         .withConsumes(['application/xml'])
    //         .build();

    //     const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

    //     expect(result.failureReason).toEqual(expectedFailedValidationError);
    //     expect(result).toContainErrors([{
    //         code: 'request.content-type.incompatible',
    //         message: 'Request Content-Type header is incompatible with the consumes mime type defined in the ' +
    //         'swagger file',
    //         mockDetails: {
    //             interactionDescription: 'interaction description',
    //             interactionState: '[none]',
    //             location: '[pactRoot].interactions[0].request.headers.Content-Type',
    //             mockFile: 'pact.json',
    //             value: 'application/json'
    //         },
    //         source: 'spec-mock-validation',
    //         specDetails: {
    //             location: '[swaggerRoot].consumes',
    //             pathMethod: 'post',
    //             pathName: '/does/exist',
    //             specFile: 'swagger.json',
    //             value: ['application/xml']
    //         },
    //         type: 'error'
    //     }]);
    // });

    // it('should use the operation consumes over the global consumes', async () => {
    //     const pactFile = pactBuilder
    //         .withInteraction(defaultInteractionBuilder.withRequestHeader('Content-Type', 'application/json'))
    //         .build();

    //     const swaggerFile = swaggerBuilder
    //         .withPath('/does/exist', pathBuilder.withPostOperation(operationBuilder.withConsumes(['application/xml'])))
    //         .withConsumes(['application/json'])
    //         .build();

    //     const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

    //     expect(result.failureReason).toEqual(expectedFailedValidationError);
    //     expect(result).toContainErrors([{
    //         code: 'request.content-type.incompatible',
    //         message: 'Request Content-Type header is incompatible with the consumes mime ' +
    //         'type defined in the swagger file',
    //         mockDetails: {
    //             interactionDescription: 'interaction description',
    //             interactionState: '[none]',
    //             location: '[pactRoot].interactions[0].request.headers.Content-Type',
    //             mockFile: 'pact.json',
    //             value: 'application/json'
    //         },
    //         source: 'spec-mock-validation',
    //         specDetails: {
    //             location: '[swaggerRoot].paths./does/exist.post.consumes',
    //             pathMethod: 'post',
    //             pathName: '/does/exist',
    //             specFile: 'swagger.json',
    //             value: ['application/xml']
    //         },
    //         type: 'error'
    //     }]);
    // });
});

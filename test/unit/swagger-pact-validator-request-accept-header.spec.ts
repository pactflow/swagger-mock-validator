import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator request accept header', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateRequestAcceptHeader = (
        swaggerProduces?: string[],
        pactRequestAcceptHeaderValue?: string
    ) => {

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

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request accept header matches the spec', willResolve(() =>
        validateRequestAcceptHeader(['application/json'], 'application/json').then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should pass when the pact request accept header is not defined', willResolve(() =>
        validateRequestAcceptHeader(['application/json']).then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should pass when neither pact request header, nor spec produces is defined', willResolve(() =>
        validateRequestAcceptHeader().then((result) => {
            expect(result).toContainNoWarnings();
        })
    ));

    it('should return a warning when pact request accept header is defined and spec produces is not', willResolve(() =>
        validateRequestAcceptHeader(undefined, 'application/json').then((result) => {
            expect(result).toContainWarnings([{
                message: 'Request accept header is defined but there is no produces definition in the spec',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    pactFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        })
    ));

    it('should return the error when the pact request accept header does not match the spec', willResolve(() => {
        const result = validateRequestAcceptHeader(['application/xml'], 'application/json');

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Accept header is incompatible with the produces mime type defined in the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    pactFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when the pact request accept header does not match the global spec', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('Accept', 'application/json'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
            .withProduces(['application/xml'])
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Accept header is incompatible with the produces mime type defined in the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    pactFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    }));

    it('should use the operation produces over the global produces', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder.withRequestHeader('Accept', 'application/json'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder.withProduces(['application/xml'])))
            .withProduces(['application/json'])
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Accept header is incompatible with the produces mime type defined in the swagger file',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.headers.Accept',
                    pactFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.produces',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    }));
});